const express = require('express');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');
const imagekit = require('../config/imagekit');
const { convertToInternationalPhone } = require('../utils/phoneHelper');
const { generateSlug } = require('../utils/slugHelper');

// Helper para exclusão assíncrona e segura no ImageKit
const safeDeleteImageKit = async (fileId) => {
  if (!fileId) return;
  try {
    await imagekit.deleteFile(fileId);
    console.log(`[ImageKit] Imagem com fileId ${fileId} deletada de forma segura.`);
  } catch (err) {
    console.error(`[ImageKit Error] Falha ao deletar imagem ${fileId}:`, err.message || err);
  }
};

/** String preenchida: não nula, não indefinida e não vazia após trim. */
function isNonEmptyString(value) {
  if (value == null) return false;
  if (typeof value !== 'string') return false;
  return value.trim().length > 0;
}

/** Primeiro valor string não vazio entre candidatos, ou null se nenhum servir. */
function pickFirstNonEmptyString(...candidates) {
  for (const v of candidates) {
    if (isNonEmptyString(v)) return v.trim();
  }
  return null;
}

/**
 * PATCH: atualiza servicePhone só se `telefone` ou `servicePhone` vierem no body.
 * Aceita o alias `telefone` usado no fluxo de criação do anúncio.
 */
function pickProfileServicePhone(body) {
  const { telefone, servicePhone } = body;
  if (telefone === undefined && servicePhone === undefined) return undefined;
  return pickFirstNonEmptyString(telefone, servicePhone) ?? null;
}

/**
 * PATCH: atualiza serviceBairro só se `bairro` ou `serviceBairro` vierem no body.
 */
function pickProfileServiceBairro(body) {
  const { bairro, serviceBairro } = body;
  if (bairro === undefined && serviceBairro === undefined) return undefined;
  return pickFirstNonEmptyString(bairro, serviceBairro) ?? null;
}

/** String opcional para o Profile: trim; vazio vira null. */
function pickOptionalProfileString(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

/** Decodifica o token JWT de forma opcional (soft auth). Retorna userId ou null. */
const getOptionalUserId = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'chave_secreta_proita_123';
    const decoded = jwt.verify(token, secret);
    return decoded.id;
  } catch (error) {
    return null;
  }
};

/**
 * Normaliza redes vindas do body (socialLinks ou redesSociais / legado network+link)
 * para o formato salvo no Prisma: [{ platform: string minúsculo, url: string }, ...] (máx. 3).
 * @returns {{ value?: unknown[], error?: string }}
 */
function normalizeSocialLinksFromBody(raw) {
  if (raw === undefined) return {};
  let list = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      return { error: 'Formato inválido: não foi possível interpretar redes sociais (JSON).' };
    }
  }
  if (!Array.isArray(list)) {
    return { error: 'Redes sociais devem ser uma lista (array).' };
  }

  const PLATFORM_ALIASES = {
    instagram: 'instagram',
    youtube: 'youtube',
    facebook: 'facebook',
    tiktok: 'tiktok',
    whatsapp: 'whatsapp',
    site: 'website',
    website: 'website',
  };

  const out = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const rawPlatform = item.platform ?? item.network;
    let platform = typeof rawPlatform === 'string' ? rawPlatform.trim().toLowerCase() : '';
    platform = PLATFORM_ALIASES[platform] ?? platform;
    const urlRaw = item.url ?? item.link;
    const url = typeof urlRaw === 'string' ? urlRaw.trim() : '';
    if (!url) continue;
    if (!platform) platform = 'website';
    out.push({ platform, url });
    if (out.length >= 3) break;
  }
  return { value: out };
}

// Campos que retornamos do User em consultas públicas
const publicUserSelect = {
  nome: true,
  sobrenome: true,
  bairro: true,
  telefone: true,
  profileImageUrl: true,
  planStatus: true,
  trialEndsAt: true,
  subscriptionEndsAt: true,
  planType: true,
};

module.exports = (prisma) => {
  const router = express.Router();

  // ─────────────────────────────────────────────────────────────
  // GET /api/ads — Listar todos os anúncios (Rota Pública)
  // ─────────────────────────────────────────────────────────────
  router.get('/', async (req, res) => {
    try {
      const userId = getOptionalUserId(req);
      const now = new Date();

      const ads = await prisma.profile.findMany({
        where: {
          user: {
            OR: [
              {
                planStatus: { in: ['ATIVO', 'BASICO'] },
                subscriptionEndsAt: { gte: now }
              },
              {
                planStatus: 'DEGUSTACAO',
                trialEndsAt: { gte: now }
              }
            ]
          }
        },
        include: { 
          user: {
            select: publicUserSelect
          },
          ...(userId && {
            favoritedBy: {
              where: { id: userId },
              select: { id: true }
            }
          })
        },
        orderBy: { createdAt: 'desc' },
      });

      const mappedAds = ads.map(ad => {
        const isFavorited = userId ? (ad.favoritedBy && ad.favoritedBy.length > 0) : false;
        const { favoritedBy, ...rest } = ad;
        return { ...rest, isFavorited };
      });

      // Dispara atualização de impressões em background de forma assíncrona (não-bloqueante)
      if (ads.length > 0) {
        const adIds = ads.map(ad => ad.id);
        prisma.profile.updateMany({
          where: { id: { in: adIds } },
          data: { impressions: { increment: 1 } }
        }).catch(err => console.error('[GET /api/ads] Erro ao incrementar impressões:', err.message));
      }

      res.status(200).json({ success: true, data: mappedAds });
    } catch (error) {
      console.error('[GET /api/ads] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro interno ao buscar anúncios.' });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // GET /api/ads/me — Anúncios do usuário logado (Rota Privada)
  // IMPORTANTE: deve vir ANTES de /:id para não ser capturada como ID
  // ─────────────────────────────────────────────────────────────
  router.get('/me', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      const ads = await prisma.profile.findMany({
        where: { userId },
        include: {
          user: {
            select: publicUserSelect
          },
          favoritedBy: { select: { id: true } }
        },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ success: true, data: ads });
    } catch (error) {
      console.error('[GET /api/ads/me] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro ao buscar seus anúncios.' });
    }
  });
  // ─────────────────────────────────────────────────────────────
  // GET /api/ads/favorites — Listar anúncios favoritados pelo usuário (Rota Privada)
  // IMPORTANTE: deve vir ANTES de /:id para não ser capturada como ID
  // ─────────────────────────────────────────────────────────────
  router.get('/favorites', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          favoriteProfiles: {
            include: {
              user: {
                select: publicUserSelect
              }
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      }

      const mappedFavorites = user.favoriteProfiles.map(ad => ({
        ...ad,
        isFavorited: true
      }));

      res.status(200).json({ success: true, data: mappedFavorites });
    } catch (error) {
      console.error('[GET /api/ads/favorites] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro ao buscar anúncios favoritos.' });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // GET /api/ads/:id — Buscar anúncio específico (Rota Pública)
  // ─────────────────────────────────────────────────────────────
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`[GET /api/ads/:id] Buscando: ${id}`);
    try {
      const userId = getOptionalUserId(req);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const ad = await prisma.profile.findUnique({
        where: isUuid ? { id: String(id) } : { slug: String(id) },
        include: { 
          user: {
            select: publicUserSelect
          },
          ...(userId && {
            favoritedBy: {
              where: { id: userId },
              select: { id: true }
            }
          })
        },
      });

      if (!ad) {
        return res.status(404).json({ success: false, message: 'Anúncio não encontrado.' });
      }

      const isFavorited = userId ? (ad.favoritedBy && ad.favoritedBy.length > 0) : false;
      const { favoritedBy, ...rest } = ad;

      res.status(200).json({ success: true, data: { ...rest, isFavorited } });
    } catch (error) {
      console.error('[GET /api/ads/:id] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro interno ao buscar anúncio.' });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // POST /api/ads — Criar um novo anúncio (Rota Privada)
  // Contato e bairro do formulário ficam só no Profile (não altera User).
  // ─────────────────────────────────────────────────────────────
  router.post('/', authMiddleware, async (req, res) => {
    const {
      atividadePrincipal, categoriaGeral, atividadesSecundarias, descricaoTrabalho,
      descricaoCurta, bioSugerida, shortDescription,
      instagram, whatsapp, endereco, portfolioUrls,
      redesSociais, socialLinks, avatarUrl, avatarFileId,
      servicePhone, serviceBairro, exibirEnderecoCompleto,
      telefone, bairro,
      nome, sobrenome,
      telefoneComercial, fotoAnuncioUrl, fotoAnuncioFileId,
      capaUrl, capaFileId, enderecoComercial, horariosFuncionamento,
      partners
    } = req.body;

    const userId = req.user.id;

    try {
      // Trava de segurança: limite máximo de 2 anúncios por conta
      const adsCount = await prisma.profile.count({ where: { userId } });
      if (adsCount >= 2) {
        return res.status(400).json({ success: false, message: 'Limite máximo de 2 anúncios atingido.' });
      }

      let socialLinksToSave = null;
      if (socialLinks !== undefined || redesSociais !== undefined) {
        const rawSocial = socialLinks !== undefined ? socialLinks : redesSociais;
        const { value, error } = normalizeSocialLinksFromBody(rawSocial);
        if (error) {
          return res.status(400).json({ success: false, message: error });
        }
        socialLinksToSave = value;
      }

      const resolvedServicePhone = pickFirstNonEmptyString(servicePhone, telefone) ?? null;
      const resolvedServiceBairro = pickFirstNonEmptyString(serviceBairro, bairro) ?? null;
      const profileWhatsapp =
        pickFirstNonEmptyString(whatsapp, servicePhone, telefone) ?? null;

      // ── Gera o próximo Código de Referência sequencial (PRO-001, PRO-002...) ──
      const lastProfile = await prisma.profile.findFirst({
        where: { referenceCode: { not: null } },
        orderBy: { referenceCode: 'desc' },
        select: { referenceCode: true },
      });

      let nextReferenceCode = 'PRO-001';
      if (lastProfile?.referenceCode) {
        const lastNum = parseInt(lastProfile.referenceCode.replace('PRO-', ''), 10);
        nextReferenceCode = `PRO-${String(lastNum + 1).padStart(3, '0')}`;
      }

      const nameForSlug = pickOptionalProfileString(nome);
      const sobForSlug = pickOptionalProfileString(sobrenome);
      let displayNameForSlug = [nameForSlug, sobForSlug].filter(Boolean).join(' ').trim();
      
      if (!displayNameForSlug) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          displayNameForSlug = [user.nome, user.sobrenome].filter(Boolean).join(' ').trim();
        }
      }
      const slug = await generateSlug(displayNameForSlug, prisma);

      const profile = await prisma.profile.create({
        data: {
          userId,
          slug,
          atividadePrincipal,
          categoriaGeral: categoriaGeral || null,
          atividadesSecundarias: atividadesSecundarias || [],
          descricaoTrabalho,
          instagram: instagram || null,
          whatsapp: profileWhatsapp,
          endereco: endereco || null,
          portfolioUrls: portfolioUrls || [],
          avatarUrl: avatarUrl || null,
          avatarFileId: avatarFileId || null,
          socialLinks: socialLinksToSave,
          redesSociais: socialLinksToSave,
          descricaoCurta: descricaoCurta || shortDescription || null,
          nomeExibicao: pickOptionalProfileString(nome),
          sobrenomeExibicao: pickOptionalProfileString(sobrenome),
          servicePhone: resolvedServicePhone,
          serviceBairro: resolvedServiceBairro,
          exibirEnderecoCompleto: exibirEnderecoCompleto !== undefined ? exibirEnderecoCompleto : true,
          telefoneComercial: convertToInternationalPhone(pickOptionalProfileString(telefoneComercial)),
          fotoAnuncioUrl: pickOptionalProfileString(fotoAnuncioUrl),
          fotoAnuncioFileId: pickOptionalProfileString(fotoAnuncioFileId),
          capaUrl: pickOptionalProfileString(capaUrl),
          capaFileId: pickOptionalProfileString(capaFileId),
          enderecoComercial: pickOptionalProfileString(enderecoComercial),
          horariosFuncionamento: horariosFuncionamento !== undefined ? horariosFuncionamento : null,
          partners: partners !== undefined ? partners : null,
          referenceCode: nextReferenceCode,
        },
      });

      // Atualiza o planStatus do usuário para 'ATIVO' e subscriptionEndsAt para 30 dias
      await prisma.user.update({
        where: { id: userId },
        data: {
          planStatus: 'ATIVO',
          subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          trialEndsAt: null,
          planType: 'TESTE'
        }
      });

      // Cria a notificação de Onboarding
      await prisma.notification.create({
        data: {
          userId,
          title: 'Bem-vindo ao proITA! 🎉',
          message: 'Seu anúncio já está no ar para toda Itapipoca! Aproveite seus 30 dias de cortesia para explorar o painel, adicionar suas melhores fotos e se destacar nas buscas. Qualquer dúvida, estamos aqui.',
          type: 'INFO',
          read: false
        }
      });

      res.status(201).json({ success: true, profile });
    } catch (error) {
      console.error('[POST /api/ads] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro interno ao salvar anúncio.' });
    }
  });

  // Handler compartilhado para atualização de anúncio (PATCH/PUT)
  const updateAdHandler = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const existing = await prisma.profile.findUnique({ where: { id } });

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Anúncio não encontrado.' });
      }

      if (existing.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Você não tem permissão para editar este anúncio.' });
      }

      const {
        atividadePrincipal, categoriaGeral, atividadesSecundarias, descricaoTrabalho,
        descricaoCurta, shortDescription, instagram, whatsapp,
        servicePhone, serviceBairro, telefone, bairro, endereco, portfolioUrls,
        avatarUrl, avatarFileId, socialLinks, redesSociais, exibirEnderecoCompleto,
        nome, sobrenome,
        telefoneComercial, fotoAnuncioUrl, fotoAnuncioFileId,
        capaUrl, capaFileId, enderecoComercial, horariosFuncionamento,
        partners
      } = req.body;

      // Validação da trava de 15 dias para Nome e Telefone
      const isChangingName = (nome !== undefined && pickOptionalProfileString(nome) !== existing.nomeExibicao) || 
                             (sobrenome !== undefined && pickOptionalProfileString(sobrenome) !== existing.sobrenomeExibicao);
      
      const incomingPhone = telefoneComercial !== undefined ? convertToInternationalPhone(pickOptionalProfileString(telefoneComercial)) : undefined;
      const isChangingPhone = incomingPhone !== undefined && incomingPhone !== existing.telefoneComercial;

      if (isChangingName || isChangingPhone) {
        if (existing.lastNamePhoneUpdate) {
          const diffMs = Date.now() - new Date(existing.lastNamePhoneUpdate).getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          if (diffDays < 15) {
            const remainingDays = Math.ceil(15 - diffDays);
            return res.status(400).json({ 
              success: false, 
              message: `Atenção: Os campos Nome e Telefone só poderão ser alterados novamente em ${remainingDays} dia(s).` 
            });
          }
        }
      }

      const shouldUpdateTimestamp = isChangingName || isChangingPhone;

      let nextSocialLinks = undefined;
      if (socialLinks !== undefined || redesSociais !== undefined) {
        const rawSocial = socialLinks !== undefined ? socialLinks : redesSociais;
        const { value, error } = normalizeSocialLinksFromBody(rawSocial);
        if (error) {
          return res.status(400).json({ success: false, message: error });
        }
        nextSocialLinks = value;
      }

      const nextServicePhone = pickProfileServicePhone(req.body);
      const nextServiceBairro = pickProfileServiceBairro(req.body);

      let nextSlug = undefined;
      if (isChangingName) {
        const nameForSlug = pickOptionalProfileString(nome) ?? existing.nomeExibicao;
        const sobForSlug = pickOptionalProfileString(sobrenome) ?? existing.sobrenomeExibicao;
        let displayNameForSlug = [nameForSlug, sobForSlug].filter(Boolean).join(' ').trim();
        if (!displayNameForSlug) {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user) {
            displayNameForSlug = [user.nome, user.sobrenome].filter(Boolean).join(' ').trim();
          }
        }
        nextSlug = await generateSlug(displayNameForSlug, prisma);
      } else if (!existing.slug) {
        const nameForSlug = existing.nomeExibicao;
        const sobForSlug = existing.sobrenomeExibicao;
        let displayNameForSlug = [nameForSlug, sobForSlug].filter(Boolean).join(' ').trim();
        if (!displayNameForSlug) {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user) {
            displayNameForSlug = [user.nome, user.sobrenome].filter(Boolean).join(' ').trim();
          }
        }
        nextSlug = await generateSlug(displayNameForSlug, prisma);
      }

      const updated = await prisma.profile.update({
        where: { id },
        data: {
          ...(nextSlug !== undefined && { slug: nextSlug }),
          ...(shouldUpdateTimestamp && { lastNamePhoneUpdate: new Date() }),
          ...(atividadePrincipal !== undefined && { atividadePrincipal }),
          ...(categoriaGeral !== undefined && { categoriaGeral }),
          ...(atividadesSecundarias !== undefined && { atividadesSecundarias }),
          ...(descricaoTrabalho !== undefined && { descricaoTrabalho }),
          ...(instagram !== undefined && { instagram }),
          ...(whatsapp !== undefined && {
            whatsapp: isNonEmptyString(whatsapp)
              ? String(whatsapp).trim()
              : pickFirstNonEmptyString(servicePhone, telefone) ?? null,
          }),
          ...(endereco !== undefined && { endereco }),
          ...(portfolioUrls !== undefined && { portfolioUrls }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(avatarFileId !== undefined && { avatarFileId }),
          ...(nextSocialLinks !== undefined && { socialLinks: nextSocialLinks, redesSociais: nextSocialLinks }),
          ...((descricaoCurta !== undefined || shortDescription !== undefined) && { descricaoCurta: descricaoCurta || shortDescription }),
          ...(nextServicePhone !== undefined && { servicePhone: nextServicePhone }),
          ...(nextServiceBairro !== undefined && { serviceBairro: nextServiceBairro }),
          ...(nome !== undefined && { nomeExibicao: pickOptionalProfileString(nome) }),
          ...(sobrenome !== undefined && { sobrenomeExibicao: pickOptionalProfileString(sobrenome) }),
          ...(exibirEnderecoCompleto !== undefined && { exibirEnderecoCompleto }),
          ...(telefoneComercial !== undefined && {
            telefoneComercial: convertToInternationalPhone(pickOptionalProfileString(telefoneComercial)),
            ...(existing.telefoneComercial !== convertToInternationalPhone(pickOptionalProfileString(telefoneComercial)) && { telefoneComercialVerificado: false })
          }),
          ...(fotoAnuncioUrl !== undefined && { fotoAnuncioUrl: pickOptionalProfileString(fotoAnuncioUrl) }),
          ...(fotoAnuncioFileId !== undefined && { fotoAnuncioFileId: pickOptionalProfileString(fotoAnuncioFileId) }),
          ...(capaUrl !== undefined && { capaUrl: pickOptionalProfileString(capaUrl) }),
          ...(capaFileId !== undefined && { capaFileId: pickOptionalProfileString(capaFileId) }),
          ...(enderecoComercial !== undefined && { enderecoComercial: pickOptionalProfileString(enderecoComercial) }),
          ...(horariosFuncionamento !== undefined && { horariosFuncionamento: horariosFuncionamento ?? null }),
          ...(partners !== undefined && { partners }),
        },
      });

      res.status(200).json({ success: true, profile: updated });
    } catch (error) {
      console.error('[UPDATE /api/ads/:id] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro interno ao atualizar anúncio.' });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // PATCH /api/ads/:id — Editar anúncio específico (Rota Privada)
  // ─────────────────────────────────────────────────────────────
  router.patch('/:id', authMiddleware, updateAdHandler);

  // ─────────────────────────────────────────────────────────────
  // PUT /api/ads/:id — Editar anúncio específico (Rota Privada / Alias)
  // ─────────────────────────────────────────────────────────────
  router.put('/:id', authMiddleware, updateAdHandler);

  // ─────────────────────────────────────────────────────────────
  // DELETE /api/ads/:id — Excluir anúncio (Rota Privada)
  // ─────────────────────────────────────────────────────────────
  router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const existing = await prisma.profile.findUnique({ where: { id } });

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Anúncio não encontrado.' });
      }

      if (existing.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Você não tem permissão para excluir este anúncio.' });
      }

      // 2. Coletar IDs de mídias para limpar no ImageKit
      const mediaFilesToDelete = [];
      if (existing.avatarFileId) mediaFilesToDelete.push(existing.avatarFileId);
      if (existing.capaFileId) mediaFilesToDelete.push(existing.capaFileId);
      if (existing.fotoAnuncioFileId) mediaFilesToDelete.push(existing.fotoAnuncioFileId);

      // Excluir mídias do ImageKit de forma assíncrona
      mediaFilesToDelete.forEach(fileId => {
        safeDeleteImageKit(fileId);
      });

      // 3. Deletar dependências no banco e depois o perfil
      await prisma.$transaction(async (tx) => {
        // Deletar serviços vinculados ao perfil
        await tx.service.deleteMany({
          where: { profileId: id }
        });

        // Deletar denúncias (reports) vinculadas
        await tx.report.deleteMany({
          where: { adId: id }
        });

        // Deletar reviews relacionados ao perfil
        await tx.review.deleteMany({
          where: { profileId: id }
        });

        // Deletar o perfil (implicit favorites will be deleted automatically)
        await tx.profile.delete({
          where: { id }
        });
      });

      res.status(200).json({ success: true, message: 'Anúncio excluído com sucesso.' });
    } catch (error) {
      console.error('[DELETE /api/ads/:id] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro interno ao excluir anúncio.' });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // POST /api/favorites/toggle — Adicionar/remover anúncios dos favoritos (Rota Privada)
  // ─────────────────────────────────────────────────────────────
  router.post('/favorites/toggle', authMiddleware, async (req, res) => {
    const { profileId } = req.body;
    const userId = req.user.id;

    if (!profileId) {
      return res.status(400).json({ success: false, message: 'O ID do perfil é obrigatório.' });
    }

    try {
      // Verifica se o perfil existe
      const profile = await prisma.profile.findUnique({
        where: { id: profileId }
      });

      if (!profile) {
        return res.status(404).json({ success: false, message: 'Anúncio não encontrado.' });
      }

      // Verifica se já está favoritado
      const alreadyFavorited = await prisma.profile.findFirst({
        where: {
          id: profileId,
          favoritedBy: {
            some: { id: userId }
          }
        }
      });

      if (alreadyFavorited) {
        // Remove dos favoritos
        await prisma.user.update({
          where: { id: userId },
          data: {
            favoriteProfiles: {
              disconnect: { id: profileId }
            }
          }
        });
        return res.status(200).json({ success: true, isFavorited: false, message: 'Removido dos favoritos.' });
      } else {
        // Adiciona aos favoritos
        await prisma.user.update({
          where: { id: userId },
          data: {
            favoriteProfiles: {
              connect: { id: profileId }
            }
          }
        });
        return res.status(200).json({ success: true, isFavorited: true, message: 'Adicionado aos favoritos!' });
      }
    } catch (error) {
      console.error('[POST /api/favorites/toggle] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro interno ao atualizar favoritos.' });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // POST /api/ads/:id/track — Rota Única de Tracking de Métricas
  // ─────────────────────────────────────────────────────────────
  router.post('/:id/track', async (req, res) => {
    const { id } = req.params;
    const { action } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, message: 'Ação de rastreamento é obrigatória.' });
    }

    try {
      let updateData = {};
      switch (action) {
        case 'view':
          updateData = { profileViews: { increment: 1 }, visitasPerfil: { increment: 1 } };
          break;
        case 'whatsapp':
          updateData = { whatsappClicks: { increment: 1 }, cliquesWhatsapp: { increment: 1 } };
          break;
        case 'phone':
          updateData = { phoneClicks: { increment: 1 } };
          break;
        case 'share':
          updateData = { shares: { increment: 1 } };
          break;
        default:
          return res.status(400).json({ success: false, message: `Ação inválida: ${action}` });
      }

      const updated = await prisma.profile.update({
        where: { id: String(id) },
        data: updateData,
        select: {
          id: true,
          impressions: true,
          profileViews: true,
          whatsappClicks: true,
          phoneClicks: true,
          shares: true,
          visitasPerfil: true,
          cliquesWhatsapp: true,
        }
      });

      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error(`[POST /api/ads/${id}/track] Erro:`, error.message);
      res.status(500).json({ success: false, message: 'Erro ao registrar métrica de tracking.' });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // POST /api/ads/simulate-payment — Simular Pagamento de Assinatura (Rota Privada de Teste)
  // ─────────────────────────────────────────────────────────────
  router.post('/simulate-payment', authMiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
      const { planId } = req.body || {};
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      }

      let planStatus = 'ATIVO';
      let durationDays = 365;
      let planType = 'PRO_ANUAL';
      
      if (planId) {
        if (String(planId).toLowerCase().includes('bienal')) {
          durationDays = 730;
        }

        if (planId === 'basico_anual') {
          planType = 'PRO_ANUAL';
        } else if (planId === 'basico_bienal') {
          planType = 'PRO_BIENAL';
        } else if (planId === 'patrocinador_anual') {
          planType = 'PATROCINADOR_ANUAL';
        } else if (planId === 'patrocinador_bienal') {
          planType = 'PATROCINADOR_BIENAL';
        }
      }

      // Cálculo de assinatura cumulativa
      let baseDate = new Date();
      if (user.planStatus === 'ATIVO' && user.subscriptionEndsAt && user.subscriptionEndsAt > baseDate) {
        baseDate = new Date(user.subscriptionEndsAt);
      }
      const subscriptionEndsAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          planStatus,
          subscriptionEndsAt,
          planType,
          trialEndsAt: null
        }
      });

      res.status(200).json({ 
        success: true, 
        user: updatedUser, 
        message: 'Simulação de pagamento efetuada com sucesso para a conta do usuário!' 
      });
    } catch (error) {
      console.error('[POST /api/ads/simulate-payment] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro ao simular pagamento.' });
    }
  });

  return router;
};

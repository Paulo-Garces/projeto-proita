const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { convertToInternationalPhone } = require('../utils/phoneHelper');

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
};

module.exports = (prisma) => {
  const router = express.Router();

  // ─────────────────────────────────────────────────────────────
  // GET /api/ads — Listar todos os anúncios (Rota Pública)
  // ─────────────────────────────────────────────────────────────
  router.get('/', async (req, res) => {
    try {
      const ads = await prisma.profile.findMany({
        include: { user: { select: publicUserSelect } },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ success: true, data: ads });
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
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ success: true, data: ads });
    } catch (error) {
      console.error('[GET /api/ads/me] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro ao buscar seus anúncios.' });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // GET /api/ads/:id — Buscar anúncio específico (Rota Pública)
  // ─────────────────────────────────────────────────────────────
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`[GET /api/ads/:id] Buscando: ${id}`);
    try {
      const ad = await prisma.profile.findUnique({
        where: { id: String(id) },
        include: { user: { select: publicUserSelect } },
      });

      if (!ad) {
        return res.status(404).json({ success: false, message: 'Anúncio não encontrado.' });
      }

      res.status(200).json({ success: true, data: ad });
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
      telefoneComercial, fotoAnuncioUrl, fotoAnuncioFileId
    } = req.body;

    const userId = req.user.id;

    try {
      // Trava de segurança: limite máximo de 4 anúncios por conta
      const adsCount = await prisma.profile.count({ where: { userId } });
      if (adsCount >= 4) {
        return res.status(400).json({ success: false, message: 'Limite máximo de 4 anúncios atingido.' });
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

      const profile = await prisma.profile.create({
        data: {
          userId,
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
          descricaoCurta: descricaoCurta || shortDescription || null,
          nomeExibicao: pickOptionalProfileString(nome),
          sobrenomeExibicao: pickOptionalProfileString(sobrenome),
          servicePhone: resolvedServicePhone,
          serviceBairro: resolvedServiceBairro,
          exibirEnderecoCompleto: exibirEnderecoCompleto !== undefined ? exibirEnderecoCompleto : true,
          telefoneComercial: convertToInternationalPhone(pickOptionalProfileString(telefoneComercial)),
          fotoAnuncioUrl: pickOptionalProfileString(fotoAnuncioUrl),
          fotoAnuncioFileId: pickOptionalProfileString(fotoAnuncioFileId),
        },
      });

      res.status(201).json({ success: true, profile });
    } catch (error) {
      console.error('[POST /api/ads] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro interno ao salvar anúncio.' });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // PATCH /api/ads/:id — Editar anúncio específico (Rota Privada)
  // ─────────────────────────────────────────────────────────────
  router.patch('/:id', authMiddleware, async (req, res) => {
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
      } = req.body;

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

      const updated = await prisma.profile.update({
        where: { id },
        data: {
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
          ...(nextSocialLinks !== undefined && { socialLinks: nextSocialLinks }),
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
        },
      });

      res.status(200).json({ success: true, profile: updated });
    } catch (error) {
      console.error('[PATCH /api/ads/:id] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro interno ao atualizar anúncio.' });
    }
  });

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

      await prisma.profile.delete({ where: { id } });
      res.status(200).json({ success: true, message: 'Anúncio excluído com sucesso.' });
    } catch (error) {
      console.error('[DELETE /api/ads/:id] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro interno ao excluir anúncio.' });
    }
  });

  return router;
};

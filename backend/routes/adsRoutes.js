const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

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
  // ─────────────────────────────────────────────────────────────
  router.post('/', authMiddleware, async (req, res) => {
    const {
      nome, sobrenome, telefone, bairro,
      atividadePrincipal, categoriaGeral, atividadesSecundarias, descricaoTrabalho,
      descricaoCurta, bioSugerida, shortDescription,
      instagram, whatsapp, endereco, portfolioUrls,
      redesSociais, socialLinks, avatarUrl, avatarFileId,
      servicePhone, serviceBairro, exibirEnderecoCompleto
    } = req.body;

    const userId = req.user.id;

    try {
      const userDataToUpdate = {};
      if (nome) userDataToUpdate.nome = nome;
      if (sobrenome) userDataToUpdate.sobrenome = sobrenome;
      if (telefone) userDataToUpdate.telefone = telefone;
      if (bairro) userDataToUpdate.bairro = bairro;

      if (Object.keys(userDataToUpdate).length > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: userDataToUpdate,
        });
      }

      const profile = await prisma.profile.create({
        data: {
          userId,
          atividadePrincipal,
          categoriaGeral: categoriaGeral || null,
          atividadesSecundarias: atividadesSecundarias || [],
          descricaoTrabalho,
          instagram: instagram || null,
          whatsapp: whatsapp || null,
          endereco: endereco || null,
          portfolioUrls: portfolioUrls || [],
          avatarUrl: avatarUrl || null,
          avatarFileId: avatarFileId || null,
          socialLinks: socialLinks || redesSociais || null,
          descricaoCurta: descricaoCurta || shortDescription || null,
          servicePhone: servicePhone || null,
          serviceBairro: serviceBairro || null,
          exibirEnderecoCompleto: exibirEnderecoCompleto !== undefined ? exibirEnderecoCompleto : true,
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
        servicePhone, serviceBairro, endereco, portfolioUrls,
        avatarUrl, avatarFileId, socialLinks, exibirEnderecoCompleto,
      } = req.body;

      if (socialLinks !== undefined) {
        if (!Array.isArray(socialLinks)) {
          return res.status(400).json({ success: false, message: 'socialLinks deve ser um array.' });
        }
        if (socialLinks.length > 3) {
          return res.status(400).json({ success: false, message: 'Máximo de 3 redes sociais permitidas.' });
        }
      }

      const updated = await prisma.profile.update({
        where: { id },
        data: {
          ...(atividadePrincipal !== undefined && { atividadePrincipal }),
          ...(categoriaGeral !== undefined && { categoriaGeral }),
          ...(atividadesSecundarias !== undefined && { atividadesSecundarias }),
          ...(descricaoTrabalho !== undefined && { descricaoTrabalho }),
          ...(instagram !== undefined && { instagram }),
          ...(whatsapp !== undefined && { whatsapp }),
          ...(endereco !== undefined && { endereco }),
          ...(portfolioUrls !== undefined && { portfolioUrls }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(avatarFileId !== undefined && { avatarFileId }),
          ...(socialLinks !== undefined && { socialLinks }),
          ...((descricaoCurta !== undefined || shortDescription !== undefined) && { descricaoCurta: descricaoCurta || shortDescription }),
          ...(servicePhone !== undefined && { servicePhone }),
          ...(serviceBairro !== undefined && { serviceBairro }),
          ...(exibirEnderecoCompleto !== undefined && { exibirEnderecoCompleto }),
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
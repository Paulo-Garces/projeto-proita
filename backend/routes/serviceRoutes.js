const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

module.exports = (prisma) => {
  const router = express.Router();

  // ─────────────────────────────────────────────────────────────
  // POST /api/services — Criar um novo serviço no catálogo (Rota Privada)
  // ─────────────────────────────────────────────────────────────
  router.post('/', authMiddleware, async (req, res) => {
    const { name, priceType, price, description, profileId } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'O nome do serviço é obrigatório.' });
    }

    if (!priceType || !['FIXO', 'A_PARTIR', 'SOB_CONSULTA'].includes(priceType)) {
      return res.status(400).json({ success: false, message: 'Tipo de preço inválido ou obrigatório.' });
    }

    if (!profileId) {
      return res.status(400).json({ success: false, message: 'O ID do anúncio (profileId) é obrigatório.' });
    }

    try {
      // Verificar se o anúncio existe e se pertence ao usuário logado
      const profile = await prisma.profile.findUnique({
        where: { id: profileId }
      });

      if (!profile) {
        return res.status(404).json({ success: false, message: 'Anúncio não encontrado.' });
      }

      if (profile.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Você não tem permissão para adicionar serviços a este anúncio.' });
      }

      // Validar o preço
      let resolvedPrice = null;
      if (priceType !== 'SOB_CONSULTA') {
        const floatPrice = parseFloat(price);
        if (isNaN(floatPrice) || floatPrice < 0) {
          return res.status(400).json({ success: false, message: 'O preço deve ser um número maior ou igual a zero.' });
        }
        resolvedPrice = floatPrice;
      }

      const service = await prisma.service.create({
        data: {
          name: name.trim(),
          priceType,
          price: resolvedPrice,
          description: description ? description.trim() : null,
          profileId
        }
      });

      res.status(201).json({ success: true, message: 'Serviço cadastrado com sucesso!', data: service });
    } catch (error) {
      console.error('[POST /api/services] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao criar o serviço.' });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // GET /api/services/:profileId — Listar serviços de um anúncio (Rota Pública)
  // ─────────────────────────────────────────────────────────────
  router.get('/:profileId', async (req, res) => {
    const { profileId } = req.params;

    if (!profileId) {
      return res.status(400).json({ success: false, message: 'O ID do anúncio é obrigatório.' });
    }

    try {
      const services = await prisma.service.findMany({
        where: { profileId },
        orderBy: { createdAt: 'asc' }
      });

      res.status(200).json({ success: true, data: services });
    } catch (error) {
      console.error('[GET /api/services/:profileId] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao listar os serviços.' });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // PUT /api/services/:id — Editar um serviço (Rota Privada)
  // ─────────────────────────────────────────────────────────────
  router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name, priceType, price, description } = req.body;
    const userId = req.user.id;

    try {
      // Buscar o serviço existente com o perfil para verificar a posse
      const existingService = await prisma.service.findUnique({
        where: { id },
        include: { profile: true }
      });

      if (!existingService) {
        return res.status(404).json({ success: false, message: 'Serviço não encontrado.' });
      }

      if (existingService.profile.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Você não tem permissão para editar este serviço.' });
      }

      // Validações condicionais defensivas
      const updateData = {};

      if (name !== undefined) {
        if (!name || !name.trim()) {
          return res.status(400).json({ success: false, message: 'O nome do serviço não pode ser vazio.' });
        }
        updateData.name = name.trim();
      }

      const activePriceType = priceType !== undefined ? priceType : existingService.priceType;
      if (priceType !== undefined) {
        if (!['FIXO', 'A_PARTIR', 'SOB_CONSULTA'].includes(priceType)) {
          return res.status(400).json({ success: false, message: 'Tipo de preço inválido.' });
        }
        updateData.priceType = priceType;
      }

      if (activePriceType === 'SOB_CONSULTA') {
        updateData.price = null;
      } else {
        const inputPrice = price !== undefined ? price : existingService.price;
        if (inputPrice !== null && inputPrice !== undefined) {
          const floatPrice = parseFloat(inputPrice);
          if (isNaN(floatPrice) || floatPrice < 0) {
            return res.status(400).json({ success: false, message: 'O preço deve ser um número maior ou igual a zero.' });
          }
          updateData.price = floatPrice;
        } else if (priceType !== undefined && existingService.price === null) {
          // Se mudou de SOB_CONSULTA para outro tipo e não mandou preço, define 0 ou valida
          return res.status(400).json({ success: false, message: 'Por favor, forneça um preço para este tipo de cobrança.' });
        }
      }

      if (description !== undefined) {
        updateData.description = description ? description.trim() : null;
      }

      const updated = await prisma.service.update({
        where: { id },
        data: updateData
      });

      res.status(200).json({ success: true, message: 'Serviço atualizado com sucesso!', data: updated });
    } catch (error) {
      console.error('[PUT /api/services/:id] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao editar o serviço.' });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // DELETE /api/services/:id — Excluir um serviço (Rota Privada)
  // ─────────────────────────────────────────────────────────────
  router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const existingService = await prisma.service.findUnique({
        where: { id },
        include: { profile: true }
      });

      if (!existingService) {
        return res.status(404).json({ success: false, message: 'Serviço não encontrado.' });
      }

      if (existingService.profile.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Você não tem permissão para excluir este serviço.' });
      }

      await prisma.service.delete({
        where: { id }
      });

      res.status(200).json({ success: true, message: 'Serviço excluído com sucesso.' });
    } catch (error) {
      console.error('[DELETE /api/services/:id] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao excluir o serviço.' });
    }
  });

  return router;
};

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

module.exports = (prisma) => {
  const router = express.Router();

  // ─────────────────────────────────────────────────────────────
  // POST /api/reviews — Criar uma nova avaliação (Rota Privada)
  // ─────────────────────────────────────────────────────────────
  router.post('/', authMiddleware, async (req, res) => {
    const { rating, comment, profileId } = req.body;
    const authorId = req.user.id;

    // 1. Validações básicas de entrada
    if (!profileId) {
      return res.status(400).json({ success: false, message: 'ID do anúncio (profileId) é obrigatório.' });
    }

    const ratingInt = parseInt(rating, 10);
    if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      return res.status(400).json({ success: false, message: 'A nota (rating) deve ser um número inteiro de 1 a 5.' });
    }

    try {
      // 2. Verificar se o anúncio existe no banco de dados
      const profile = await prisma.profile.findUnique({
        where: { id: profileId }
      });

      if (!profile) {
        return res.status(404).json({ success: false, message: 'Anúncio não encontrado.' });
      }

      // 3. Trava de segurança: impede o dono de avaliar o próprio anúncio
      if (profile.userId === authorId) {
        return res.status(400).json({ success: false, message: 'Você não pode avaliar o seu próprio anúncio.' });
      }

      // 4. Criar a avaliação no banco
      const review = await prisma.review.create({
        data: {
          rating: ratingInt,
          comment: comment ? comment.trim() : null,
          profileId,
          authorId
        },
        include: {
          author: {
            select: {
              nome: true,
              sobrenome: true,
              profileImageUrl: true
            }
          }
        }
      });

      // 5. Recalcular a média de avaliação e a contagem do profissional
      const allReviews = await prisma.review.findMany({
        where: { profileId }
      });

      const reviewCount = allReviews.length;
      const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
      const avgRating = parseFloat((sum / reviewCount).toFixed(1)); // ex: 4.7

      // Atualizar o perfil correspondente com as novas métricas recalculadas
      await prisma.profile.update({
        where: { id: profileId },
        data: {
          rating: avgRating,
          reviewCount: reviewCount
        }
      });

      res.status(201).json({
        success: true,
        message: 'Avaliação enviada com sucesso!',
        data: review,
        profileStats: {
          rating: avgRating,
          reviewCount
        }
      });
    } catch (error) {
      console.error('[POST /api/reviews] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao processar a avaliação.' });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // GET /api/reviews/:profileId — Buscar avaliações de um anúncio (Rota Pública)
  // ─────────────────────────────────────────────────────────────
  router.get('/:profileId', async (req, res) => {
    const { profileId } = req.params;

    if (!profileId) {
      return res.status(400).json({ success: false, message: 'ID do anúncio é obrigatório.' });
    }

    try {
      // Buscar todas as avaliações ordenadas pela data mais recente
      const reviews = await prisma.review.findMany({
        where: { profileId },
        include: {
          author: {
            select: {
              nome: true,
              sobrenome: true,
              profileImageUrl: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.status(200).json({ success: true, data: reviews });
    } catch (error) {
      console.error('[GET /api/reviews] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao buscar as avaliações.' });
    }
  });

  return router;
};

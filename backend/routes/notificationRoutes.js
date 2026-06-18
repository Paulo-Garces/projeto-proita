const express = require('express');

module.exports = (prisma) => {
  const router = express.Router();

  // GET /api/notifications -> List notifications for the authenticated user (newest first)
  router.get('/', async (req, res) => {
    try {
      const userId = req.user.id;
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      
      res.status(200).json({ success: true, data: notifications });
    } catch (error) {
      console.error('[GET /api/notifications] Erro ao buscar notificações:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao buscar notificações.' });
    }
  });

  // PATCH /api/notifications/:id/read -> Mark a notification as read
  router.patch('/:id/read', async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Ensure the notification exists and belongs to the authenticated user
      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notificação não encontrada.' });
      }

      const updatedNotification = await prisma.notification.update({
        where: { id },
        data: { read: true },
      });

      res.status(200).json({ success: true, data: updatedNotification });
    } catch (error) {
      console.error('[PATCH /api/notifications/:id/read] Erro ao marcar como lida:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao atualizar notificação.' });
    }
  });

  return router;
};

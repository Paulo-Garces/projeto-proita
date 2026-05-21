const express = require('express');
const multer = require('multer');
const imagekit = require('../config/imagekit'); // instância configurada com new ImageKit(...)
const authMiddleware = require('../middleware/authMiddleware');

// Multer: armazena em memória (buffer), sem salvar no disco
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas.'), false);
    }
  },
});

// Exporta como função que recebe o prisma (igual ao padrão das outras rotas)
module.exports = (prisma) => {
  const router = express.Router();

  // POST /api/upload/avatar
  // Usado no fluxo de criação de anúncio (Advertise.jsx).
  // Não salva no banco — apenas faz upload e retorna a URL para o frontend guardar.
  router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
      }

      const userId = req.user.id;
      const fileName = `avatar_${userId}_${Date.now()}`;
      const base64 = req.file.buffer.toString('base64');

      const result = await imagekit.upload({
        file: base64,
        fileName: fileName,
        folder: '/proita/avatars',
        useUniqueFileName: false,
        tags: [`user_${userId}`],
      });

      console.log(`[UPLOAD] Avatar enviado: ${result.url}`);

      res.status(200).json({
        success: true,
        url: result.url,
        fileId: result.fileId,
      });
    } catch (error) {
      console.error('[UPLOAD] Erro ao fazer upload do avatar:', error.message);
      res.status(500).json({ success: false, message: 'Erro ao fazer upload da imagem.' });
    }
  });

  // POST /api/upload/foto-anuncio
  // Usado para carregar a foto comercial/logo do anúncio.
  // Faz o upload ao ImageKit e retorna a url e o fileId gerados.
  router.post('/foto-anuncio', authMiddleware, upload.single('fotoAnuncio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
      }

      const userId = req.user.id;
      const fileName = `foto_anuncio_${userId}_${Date.now()}`;
      const base64 = req.file.buffer.toString('base64');

      const result = await imagekit.upload({
        file: base64,
        fileName: fileName,
        folder: '/proita/ad-logos',
        useUniqueFileName: false,
        tags: [`user_${userId}`, 'ad-logo'],
      });

      console.log(`[UPLOAD] Foto de anúncio enviada: ${result.url}`);

      res.status(200).json({
        success: true,
        url: result.url,
        fileId: result.fileId,
      });
    } catch (error) {
      console.error('[UPLOAD] Erro ao fazer upload da foto do anúncio:', error.message);
      res.status(500).json({ success: false, message: 'Erro ao processar e enviar a foto do anúncio.' });
    }
  });

  // PATCH /api/upload/profile-image
  // Usado no Dashboard ("Meus Dados").
  // Faz o upload ao ImageKit E salva a URL no banco (tabela User).
  router.patch('/profile-image', authMiddleware, upload.single('profileImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
      }

      const userId = req.user.id;
      const fileName = `profile_${userId}_${Date.now()}`;
      const base64 = req.file.buffer.toString('base64');

      console.log(`[UPLOAD] Iniciando upload ao ImageKit para userId: ${userId}`);
      console.log(`[UPLOAD] Credenciais — publicKey: ${process.env.IMAGEKIT_PUBLIC_KEY?.substring(0, 12)}... urlEndpoint: ${process.env.IMAGEKIT_URL_ENDPOINT}`);

      // 1. Envia para o ImageKit
      const result = await imagekit.upload({
        file: base64,
        fileName: fileName,
        folder: '/proita/profile-images',
        useUniqueFileName: false,
        tags: [`user_${userId}`, 'profile'],
      });

      console.log(`[UPLOAD] Foto de perfil enviada ao ImageKit com sucesso: ${result.url}`);

      // 2. Salva a URL no banco de dados (modelo User)
      await prisma.user.update({
        where: { id: userId },
        data: {
          profileImageUrl: result.url,
          profileImageFileId: result.fileId,
        },
      });

      console.log(`[DB] profileImageUrl atualizado para o usuário: ${userId}`);

      res.status(200).json({
        success: true,
        profileImageUrl: result.url,
        profileImageFileId: result.fileId,
      });
    } catch (error) {
      console.error('[UPLOAD] ===== ERRO DETALHADO NO IMAGEKIT =====');
      console.error('[UPLOAD] Mensagem:', error.message);
      console.error('[UPLOAD] Código HTTP:', error.statusCode || error.status || 'N/A');
      console.error('[UPLOAD] Resposta:', JSON.stringify(error.response || error, null, 2));
      console.error('[UPLOAD] ========================================');
      res.status(500).json({
        success: false,
        message: `Erro ao atualizar foto: ${error.message}`,
        detail: error.statusCode || null
      });
    }
  });

  // POST /api/upload/portfolio/:adId
  // Faz upload de uma imagem ao ImageKit e adiciona a URL ao array portfolioUrls do Profile.
  router.post('/portfolio/:adId', authMiddleware, upload.single('portfolioImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
      }
      const { adId } = req.params;
      const userId = req.user.id;

      const ad = await prisma.profile.findUnique({ where: { id: adId } });
      if (!ad) return res.status(404).json({ success: false, message: 'Anúncio não encontrado.' });
      if (ad.userId !== userId) return res.status(403).json({ success: false, message: 'Sem permissão.' });

      const fileName = `portfolio_${adId}_${Date.now()}`;
      const base64 = req.file.buffer.toString('base64');

      const result = await imagekit.upload({
        file: base64,
        fileName,
        folder: '/proita/portfolio',
        useUniqueFileName: false,
        tags: [`ad_${adId}`, 'portfolio'],
      });

      // Adiciona a URL ao array existente
      const updated = await prisma.profile.update({
        where: { id: adId },
        data: { portfolioUrls: { push: result.url } },
      });

      console.log(`[UPLOAD] Portfólio: ${result.url} adicionado ao anúncio ${adId}`);
      res.status(200).json({ success: true, url: result.url, portfolioUrls: updated.portfolioUrls });
    } catch (error) {
      console.error('[UPLOAD] Erro no portfólio:', error.message);
      res.status(500).json({ success: false, message: `Erro ao fazer upload: ${error.message}` });
    }
  });

  // DELETE /api/upload/portfolio/:adId
  // Remove uma URL específica do array portfolioUrls do Profile.
  router.delete('/portfolio/:adId', authMiddleware, async (req, res) => {
    try {
      const { adId } = req.params;
      const { url } = req.body;
      const userId = req.user.id;

      const ad = await prisma.profile.findUnique({ where: { id: adId } });
      if (!ad) return res.status(404).json({ success: false, message: 'Anúncio não encontrado.' });
      if (ad.userId !== userId) return res.status(403).json({ success: false, message: 'Sem permissão.' });

      const updated = await prisma.profile.update({
        where: { id: adId },
        data: { portfolioUrls: { set: ad.portfolioUrls.filter(u => u !== url) } },
      });

      res.status(200).json({ success: true, portfolioUrls: updated.portfolioUrls });
    } catch (error) {
      console.error('[DELETE] Erro ao remover do portfólio:', error.message);
      res.status(500).json({ success: false, message: 'Erro ao remover imagem.' });
    }
  });

  return router;
};


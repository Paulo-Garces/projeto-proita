const express = require('express');
const bcrypt = require('bcryptjs'); // Importado para criptografar a nova senha
const { convertToInternationalPhone, getPhoneVariations } = require('../utils/phoneHelper');

module.exports = (prisma) => {
  const router = express.Router();

  // Middleware local para verificar se é ADMIN
  const checkAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Acesso Restrito. Necessário privilégios de administrador.' });
    }
  };

  // Rota 1: Estatísticas do Dashboard
  router.get('/stats', checkAdmin, async (req, res) => {
    try {
      const totalUsers = await prisma.user.count();
      const totalAds = await prisma.profile.count();

      // Calcula usuários na última semana (opcional)
      const umaSemanaAtras = new Date();
      umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);

      const newUsersThisWeek = await prisma.user.count({
        where: {
          createdAt: {
            gte: umaSemanaAtras
          }
        }
      });

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          totalAds,
          newUsersThisWeek
        }
      });
    } catch (error) {
      console.error('Erro ao buscar stats do admin:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao buscar estatísticas.' });
    }
  });

  // Rota 2: Listagem de Usuários (Gestão de Profissionais)
  router.get('/users', checkAdmin, async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          nome: true,
          sobrenome: true,
          telefone: true,
          role: true,
          createdAt: true,
          profile: {
            select: { id: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const mappedUsers = users.map(user => ({
        id: user.id,
        nome: `${user.nome} ${user.sobrenome}`,
        telefone: user.telefone,
        role: user.role,
        hasAd: !!user.profile, // Converte para booleano
        createdAt: user.createdAt
      }));

      res.status(200).json({
        success: true,
        data: mappedUsers
      });
    } catch (error) {
      console.error('Erro ao buscar usuários do admin:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao buscar usuários.' });
    }
  });

  // Rota 3: Alterar a Senha (Qualquer Usuário Logado)
  router.put('/change-password', async (req, res) => {
    try {
      const { senhaAtual, novaSenha } = req.body;

      // O ID do usuário vem injetado pelo seu middleware de autenticação global
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
      }

      // 1. Validar se a nova senha tem exatamente 6 números
      const regexNumeros = /^\d{6}$/;
      if (!regexNumeros.test(novaSenha)) {
        return res.status(400).json({ success: false, message: 'A nova senha deve conter exatamente 6 números.' });
      }

      // 2. Buscar o usuário no banco usando o Prisma
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      }

      // Se o usuário não tiver senha (entrou via Google, por exemplo)
      if (!user.senha) {
         return res.status(400).json({ success: false, message: 'Usuários cadastrados via Google não podem alterar a senha por aqui.' });
      }

      // 3. Verificar se a senha atual digitada está correta
      const isMatch = await bcrypt.compare(senhaAtual, user.senha);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'A senha atual está incorreta.' });
      }

      // 4. Criptografar a nova senha de 6 dígitos
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(novaSenha, salt);

      // 5. Salvar a nova senha criptografada no banco
      await prisma.user.update({
        where: { id: userId },
        data: { senha: hashedPassword }
      });

      res.status(200).json({ success: true, message: 'Senha alterada com sucesso!' });
    } catch (error) {
      console.error("Erro ao mudar senha no backend:", error);
      res.status(500).json({ success: false, message: 'Erro interno no servidor ao alterar a senha.' });
    }
  });

  // Rota 4: Vincular E-mail
  router.put('/link-email', async (req, res) => {
    try {
      const { email } = req.body;
      const userId = req.user?.id;

      if (!userId || !email) {
        return res.status(400).json({ success: false, message: 'Dados inválidos.' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ success: false, message: 'Este e-mail já está sendo utilizado por outra conta.' });
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { email },
        select: { id: true, email: true, googleId: true }
      });

      res.status(200).json({ success: true, message: 'E-mail vinculado com sucesso!', user: updated });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erro interno ao vincular e-mail.' });
    }
  });

  // Rota 5: Vincular Conta Google
  router.put('/link-google', async (req, res) => {
    try {
      const { email, googleId } = req.body;
      const userId = req.user?.id;

      if (!userId || !googleId || !email) {
        return res.status(400).json({ success: false, message: 'Dados inválidos.' });
      }

      const existingGoogle = await prisma.user.findUnique({ where: { googleId } });
      if (existingGoogle && existingGoogle.id !== userId) {
        return res.status(409).json({ success: false, message: 'Esta conta Google já está vinculada a outro perfil.' });
      }

      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail && existingEmail.id !== userId) {
        return res.status(409).json({ success: false, message: 'Este e-mail do Google já está sendo utilizado por outra conta.' });
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { email, googleId },
        select: { id: true, email: true, googleId: true }
      });

      res.status(200).json({ success: true, message: 'Conta Google vinculada com sucesso!', user: updated });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erro interno ao vincular conta Google.' });
    }
  });

  // Rota 6: Vincular Telefone/WhatsApp
  router.put('/link-phone', async (req, res) => {
    try {
      const { telefone } = req.body;
      const userId = req.user?.id;

      if (!userId || !telefone) {
        return res.status(400).json({ success: false, message: 'Dados inválidos.' });
      }

      // Remove caracteres não numéricos e valida o tamanho nacional do número
      let clean = telefone.replace(/\D/g, '');
      if (clean.startsWith('55') && (clean.length === 12 || clean.length === 13)) {
        clean = clean.slice(2);
      }

      if (clean.length < 10 || clean.length > 11) {
        return res.status(400).json({ success: false, message: 'Telefone inválido. Use o formato (XX) XXXXX-XXXX.' });
      }

      const variations = getPhoneVariations(telefone);

      // Verifica se já está em uso por outra conta
      const existingUser = await prisma.user.findFirst({
        where: {
          telefone: { in: variations },
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Este telefone já está sendo utilizado por outra conta.' });
      }

      const formattedPhone = convertToInternationalPhone(telefone);

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { telefone: formattedPhone },
        select: { id: true, telefone: true }
      });

      res.status(200).json({ success: true, message: 'Telefone vinculado com sucesso!', user: updated });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erro interno ao vincular telefone.' });
    }
  });

  // Rota 7: Desvincular Conta Google
  router.delete('/unlink-google', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      }

      // Segurança: só permite desvincular se o utilizador tiver senha + telefone (método alternativo de login)
      if (!user.senha || !user.telefone) {
        return res.status(400).json({ success: false, message: 'Você precisa ter telefone e senha cadastrados antes de desvincular o Google, para não perder o acesso à conta.' });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { googleId: null }
      });

      res.status(200).json({ success: true, message: 'Conta Google desvinculada com sucesso.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erro interno ao desvincular conta Google.' });
    }
  });

  return router;
};
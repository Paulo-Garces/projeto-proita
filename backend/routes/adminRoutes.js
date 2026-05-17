const express = require('express');
const bcrypt = require('bcryptjs'); // Importado para criptografar a nova senha

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

      // 3. Verificar se a senha atual digitada está correta
      const isMatch = await bcrypt.compare(senhaAtual, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'A senha atual está incorreta.' });
      }

      // 4. Criptografar a nova senha de 6 dígitos
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(novaSenha, salt);

      // 5. Salvar a nova senha criptografada no banco
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      res.status(200).json({ success: true, message: 'Senha alterada com sucesso!' });
    } catch (error) {
      console.error("Erro ao mudar senha no backend:", error);
      res.status(500).json({ success: false, message: 'Erro interno no servidor ao alterar a senha.' });
    }
  });

  return router;
};
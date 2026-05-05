const express = require('express');

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

  return router;
};

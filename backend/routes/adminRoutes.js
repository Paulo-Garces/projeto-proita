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
      const now = new Date();
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const [
        totalUsers,
        totalProfessionals,
        activeAds,
        activeSubscriptions,
        newUsersThisWeek
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            profiles: {
              some: {}
            }
          }
        }),
        prisma.profile.count({
          where: {
            user: {
              OR: [
                {
                  planStatus: { in: ['ATIVO', 'BASICO'] },
                  subscriptionEndsAt: { gte: fiveDaysAgo }
                },
                {
                  planStatus: 'DEGUSTACAO',
                  trialEndsAt: { gte: now }
                }
              ]
            }
          }
        }),
        prisma.user.count({
          where: {
            planStatus: { in: ['ATIVO', 'BASICO'] },
            subscriptionEndsAt: { gte: now }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          totalProfessionals,
          activeAds,
          activeSubscriptions,
          newUsersThisWeek
        }
      });
    } catch (error) {
      console.error('Erro ao buscar stats do admin:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao buscar estatísticas.' });
    }
  });

  // Rota 2: Listagem de Usuários (Gestão de Profissionais) — enriquecida
  router.get('/users', checkAdmin, async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          nome: true,
          sobrenome: true,
          email: true,
          telefone: true,
          role: true,
          planStatus: true,
          subscriptionEndsAt: true,
          trialEndsAt: true,
          createdAt: true,
          profiles: {
            select: {
              id: true,
              referenceCode: true,
              atividadePrincipal: true,
            },
            orderBy: { createdAt: 'asc' },
            take: 1,
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const mappedUsers = users.map(user => ({
        id: user.id,
        nome: `${user.nome} ${user.sobrenome || ''}`.trim(),
        email: user.email || null,
        telefone: user.telefone || null,
        role: user.role,
        planStatus: user.planStatus,
        subscriptionEndsAt: user.subscriptionEndsAt,
        trialEndsAt: user.trialEndsAt,
        hasAd: !!(user.profiles && user.profiles.length > 0),
        referenceCode: user.profiles?.[0]?.referenceCode || null,
        adCategory: user.profiles?.[0]?.atividadePrincipal || null,
        createdAt: user.createdAt,
      }));

      res.status(200).json({ success: true, data: mappedUsers });
    } catch (error) {
      console.error('[GET /admin/users] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro interno ao buscar usuários.' });
    }
  });

  // Rota 2b: Bloquear / Reativar usuário (altera role)
  router.patch('/users/:id/role', checkAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const validRoles = ['USER', 'ADMIN', 'BLOCKED'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Role inválida. Use: ${validRoles.join(', ')}.` });
    }
    try {
      const updated = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, role: true, nome: true }
      });
      res.status(200).json({ success: true, user: updated, message: `Conta atualizada para "${role}".` });
    } catch (error) {
      console.error('[PATCH /admin/users/:id/role] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro ao atualizar role do usuário.' });
    }
  });

  // Rota 2c: Estender/renovar plano do usuário (+ N dias)
  router.post('/users/:id/extend-plan', checkAdmin, async (req, res) => {
    const { id } = req.params;
    const { days = 30 } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });

      const base = (user.subscriptionEndsAt && user.subscriptionEndsAt > new Date())
        ? new Date(user.subscriptionEndsAt)
        : (user.trialEndsAt && user.trialEndsAt > new Date())
          ? new Date(user.trialEndsAt)
          : new Date();

      base.setDate(base.getDate() + Number(days));

      const updated = await prisma.user.update({
        where: { id },
        data: { planStatus: 'ATIVO', subscriptionEndsAt: base, trialEndsAt: null },
        select: { id: true, planStatus: true, subscriptionEndsAt: true }
      });
      res.status(200).json({ success: true, user: updated, message: `Plano estendido por ${days} dia(s) até ${base.toLocaleDateString('pt-BR')}.` });
    } catch (error) {
      console.error('[POST /admin/users/:id/extend-plan] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro ao estender plano.' });
    }
  });

  // Rota 2d: Enviar e-mail de recuperação de senha para o usuário
  router.post('/users/:id/send-reset', checkAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      if (!user.email) return res.status(400).json({ success: false, message: 'Este usuário não possui e-mail cadastrado.' });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 3600000); // 1h
      await prisma.user.update({ where: { id }, data: { resetCode: code, resetCodeExpires: expires } });

      const sendEmail = require('../utils/sendEmail');
      const emailResult = await sendEmail(
        user.email,
        'Recuperação de Senha - proITA (Admin)',
        `Olá, ${user.nome}!\n\nO administrador solicitou a recuperação da sua senha.\nSeu código de acesso é: ${code}\n\nEste código expira em 1 hora.`
      );

      if (emailResult.success) {
        res.status(200).json({ success: true, message: `E-mail de recuperação enviado para ${user.email}.` });
      } else {
        res.status(500).json({ success: false, message: 'Falha ao enviar o e-mail. Verifique as configurações SMTP.' });
      }
    } catch (error) {
      console.error('[POST /admin/users/:id/send-reset] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro ao enviar e-mail de recuperação.' });
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

  // ─────────────────────────────────────────────────────────────
  // CENTRAL DE MODERAÇÃO — Rotas de Denúncias
  // ─────────────────────────────────────────────────────────────

  // Rota 8: Listar todas as denúncias com dados do anúncio denunciado
  router.get('/reports', checkAdmin, async (req, res) => {
    try {
      const { status } = req.query; // Filtro opcional: ?status=pendente

      const reports = await prisma.report.findMany({
        where: status ? { status } : undefined,
        include: {
          ad: {
            select: {
              id: true,
              referenceCode: true,
              atividadePrincipal: true,
              nomeExibicao: true,
              sobrenomeExibicao: true,
              user: {
                select: { nome: true, sobrenome: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const mapped = reports.map(r => ({
        id: r.id,
        adId: r.adId,
        referenceCode: r.ad?.referenceCode || null,
        adName: r.ad?.nomeExibicao
          ? `${r.ad.nomeExibicao} ${r.ad.sobrenomeExibicao || ''}`.trim()
          : `${r.ad?.user?.nome || ''} ${r.ad?.user?.sobrenome || ''}`.trim(),
        adCategory: r.ad?.atividadePrincipal || null,
        reason: r.reason,
        details: r.details || null,
        reporterUserId: r.reporterUserId || null,
        status: r.status,
        createdAt: r.createdAt,
      }));

      res.status(200).json({ success: true, data: mapped });
    } catch (error) {
      console.error('[GET /admin/reports] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro interno ao buscar denúncias.' });
    }
  });

  // Rota 9: Atualizar status de uma denúncia (resolver / ignorar)
  router.patch('/reports/:id/status', checkAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pendente', 'resolvido', 'ignorado'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status inválido. Use: ${validStatuses.join(', ')}.`
      });
    }

    try {
      const updated = await prisma.report.update({
        where: { id },
        data: { status }
      });
      res.status(200).json({ success: true, report: updated });
    } catch (error) {
      console.error('[PATCH /admin/reports/:id/status] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro ao atualizar status da denúncia.' });
    }
  });

  // Rota 10: Contadores de denúncias por status (para o card do dashboard)
  router.get('/reports/stats', checkAdmin, async (req, res) => {
    try {
      const [pendente, resolvido, ignorado, total] = await Promise.all([
        prisma.report.count({ where: { status: 'pendente' } }),
        prisma.report.count({ where: { status: 'resolvido' } }),
        prisma.report.count({ where: { status: 'ignorado' } }),
        prisma.report.count(),
      ]);
      res.status(200).json({ success: true, data: { pendente, resolvido, ignorado, total } });
    } catch (error) {
      console.error('[GET /admin/reports/stats] Erro:', error.message);
      res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas de denúncias.' });
    }
  });

  return router;
};
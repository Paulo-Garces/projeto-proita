const express = require('express');
const bcrypt = require('bcryptjs'); // Importado para criptografar a nova senha
const jwt = require('jsonwebtoken');
const imagekit = require('../config/imagekit');
const { convertToInternationalPhone, getPhoneVariations } = require('../utils/phoneHelper');
const { generateSlug } = require('../utils/slugHelper');

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
            profiles: {
              some: {}
            },
            OR: [
              {
                planStatus: { in: ['ATIVO', 'BASICO'] },
                subscriptionEndsAt: { gte: now }
              },
              {
                planStatus: 'DEGUSTACAO',
                trialEndsAt: { gte: now }
              }
            ]
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

  // Rota Temporária: Migrar perfis antigos gerando Slugs amigáveis
  router.put('/migrate-slugs', checkAdmin, async (req, res) => {
    try {
      const profilesWithoutSlug = await prisma.profile.findMany({
        where: {
          OR: [
            { slug: null },
            { slug: '' }
          ]
        },
        include: { user: true }
      });

      console.log(`[MIGRATE SLUGS] Encontrados ${profilesWithoutSlug.length} perfis para migrar.`);
      const migrated = [];

      for (const profile of profilesWithoutSlug) {
        const namePart = profile.nomeExibicao;
        const sobPart = profile.sobrenomeExibicao;
        let displayName = [namePart, sobPart].filter(Boolean).join(' ').trim();
        
        if (!displayName && profile.user) {
          displayName = [profile.user.nome, profile.user.sobrenome].filter(Boolean).join(' ').trim();
        }

        const slug = await generateSlug(displayName, prisma);
        
        await prisma.profile.update({
          where: { id: profile.id },
          data: { slug }
        });

        migrated.push({ id: profile.id, name: displayName, slug });
      }

      res.status(200).json({
        success: true,
        message: `Migração concluída. ${migrated.length} perfis atualizados.`,
        migrated
      });
    } catch (error) {
      console.error('[MIGRATE SLUGS] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro ao migrar slugs.', error: error.message });
    }
  });

  // Rota 2: Listagem de Usuários (Gestão de Profissionais) — enriquecida
  router.get('/users', checkAdmin, async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        include: {
          profiles: true
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
        planType: user.planType || null,
        hasAd: !!(user.profiles && user.profiles.length > 0),
        referenceCode: user.profiles?.[0]?.referenceCode || null,
        adCategory: user.profiles?.[0]?.atividadePrincipal || null,
        createdAt: user.createdAt,
        adminNotes: user.adminNotes || null,
        profileImageUrl: user.profileImageUrl || null,
        avatarUrl: user.profiles?.[0]?.avatarUrl || null,
        capaUrl: user.profiles?.[0]?.capaUrl || null,
        fotoAnuncioUrl: user.profiles?.[0]?.fotoAnuncioUrl || null,
        profiles: user.profiles || []
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
    const { days = 30, planType } = req.body;
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
        data: { planStatus: 'ATIVO', subscriptionEndsAt: base, trialEndsAt: null, planType },
        select: { id: true, planStatus: true, subscriptionEndsAt: true, planType: true }
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

  // Rota 11: Disparo de notificações pelo admin (com opção de e-mail - ASSÍNCRONO/BACKGROUND)
  router.post('/notifications', checkAdmin, async (req, res) => {
    const { userId, title, message, type, sendEmail } = req.body;

    if (!userId || !title || !message || !type) {
      return res.status(400).json({ success: false, message: 'Os campos userId, title, message e type são obrigatórios.' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, nome: true, sobrenome: true }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      }

      // Salva no banco de dados a notificação
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type
        }
      });

      // Se sendEmail for true, tenta enviar no background sem bloquear o response da requisição HTTP
      if (sendEmail === true || sendEmail === 'true') {
        if (user.email) {
          const sendEmailUtil = require('../utils/sendEmail');
          
          const htmlBody = `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #0284c7; margin: 0;">Portal proITA</h2>
                <p style="font-size: 14px; color: #64748b; margin-top: 5px;">Guia de Profissionais e Serviços</p>
              </div>
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
                <h3 style="color: #0f172a; margin-top: 0; font-size: 18px;">${title}</h3>
                <p style="font-size: 16px; color: #334155; line-height: 1.6;">Olá, ${user.nome} ${user.sobrenome || ''}!</p>
                <p style="font-size: 15px; color: #334155; line-height: 1.6; white-space: pre-line;">${message}</p>
              </div>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 11px; color: #94a3b8; text-align: center;">Esta é uma mensagem automática enviada pelo portal proITA. Por favor, não responda a este e-mail.</p>
            </div>
          `;

          // Dispara em background
          sendEmailUtil(user.email, title, message, htmlBody)
            .then(result => {
              if (result.success) {
                console.log(`[Email Admin] E-mail enviado com sucesso para ${user.email}`);
              } else {
                console.error(`[Email Admin Error] Falha ao enviar e-mail para ${user.email}:`, result.error);
              }
            })
            .catch(err => {
              console.error(`[Email Admin Catch Error] Erro inesperado no envio de e-mail para ${user.email}:`, err);
            });
        } else {
          console.warn(`[Email Admin Warning] O usuário ${userId} não possui e-mail cadastrado. Disparo pulado.`);
        }
      }

      // Retorna imediatamente após salvar no banco de dados
      return res.status(201).json({
        success: true,
        message: 'Notificação criada com sucesso no sistema!',
        data: notification,
        emailTriggered: !!(sendEmail && user.email)
      });

    } catch (error) {
      console.error('[POST /admin/notifications] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao processar a notificação.' });
    }
  });

  // Rota 12: Disparo de notificações em massa (broadcast)
  router.post('/notifications/broadcast', checkAdmin, async (req, res) => {
    const { title, message, type } = req.body;

    if (!title || !message || !type) {
      return res.status(400).json({ success: false, message: 'Os campos title, message e type são obrigatórios.' });
    }

    try {
      // Busca os IDs de todos os usuários do banco
      const users = await prisma.user.findMany({
        select: { id: true }
      });

      if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'Nenhum usuário encontrado no sistema.' });
      }

      // Prepara o array de dados para inserção em lote
      const notificationsData = users.map(user => ({
        userId: user.id,
        title,
        message,
        type,
        read: false
      }));

      // Utiliza createMany para inserção em lote otimizada
      const result = await prisma.notification.createMany({
        data: notificationsData,
        skipDuplicates: true
      });

      res.status(201).json({
        success: true,
        message: `Notificação geral enviada com sucesso para ${result.count} usuários!`,
        count: result.count
      });

    } catch (error) {
      console.error('[POST /admin/notifications/broadcast] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao processar o disparo em massa.' });
    }
  });

  // Rota 13: Renovar / Estender Plano de um profissional manualmente
  router.patch('/users/:id/extend', checkAdmin, async (req, res) => {
    const { id } = req.params;
    const { option, customDate, planType } = req.body;

    if (!option) {
      return res.status(400).json({ success: false, message: 'O campo option é obrigatório.' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, planStatus: true, subscriptionEndsAt: true, trialEndsAt: true, nome: true }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      }

      let newExpirationDate = new Date();
      // Se o usuário já tiver uma data de expiração ativa e no futuro, podemos estender a partir dela
      const currentExpiration = user.subscriptionEndsAt || user.trialEndsAt;
      const baseDate = (currentExpiration && new Date(currentExpiration) > new Date()) 
        ? new Date(currentExpiration) 
        : new Date();

      if (option === '30d') {
        newExpirationDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else if (option === '365d') {
        newExpirationDate = new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000);
      } else if (option === 'custom') {
        if (!customDate) {
          return res.status(400).json({ success: false, message: 'Data customizada é obrigatória para esta opção.' });
        }
        newExpirationDate = new Date(customDate);
        // Garante hora no final do dia
        newExpirationDate.setHours(23, 59, 59, 999);
      } else {
        return res.status(400).json({ success: false, message: 'Opção de extensão inválida.' });
      }

      // Atualiza o plano do usuário para ATIVO e define a expiração
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          planStatus: 'ATIVO',
          subscriptionEndsAt: newExpirationDate,
          trialEndsAt: null, // Limpa trial se houver para priorizar o plano ativo
          planType: planType || undefined
        }
      });

      res.status(200).json({
        success: true,
        message: `Plano de ${updatedUser.nome || 'usuário'} estendido com sucesso até ${newExpirationDate.toLocaleDateString('pt-BR')}!`,
        data: {
          planStatus: updatedUser.planStatus,
          subscriptionEndsAt: updatedUser.subscriptionEndsAt,
          planType: updatedUser.planType
        }
      });

    } catch (error) {
      console.error('[PATCH /admin/users/:id/extend] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao estender plano do usuário.' });
    }
  });

  // Rota 14: Modo Deus (Impersonate)
  router.post('/users/:id/impersonate', checkAdmin, async (req, res) => {
    const { id } = req.params;

    try {
      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true, nome: true }
      });

      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'Usuário de destino não encontrado.' });
      }

      const secret = process.env.JWT_SECRET || 'chave_secreta_proita_123';
      const token = jwt.sign(
        { id: targetUser.id, role: targetUser.role },
        secret,
        { expiresIn: '7d' }
      );

      console.log(`[Impersonation] Admin ${req.user.id} impersonou o usuário ${targetUser.nome} (${targetUser.id})`);

      res.status(200).json({
        success: true,
        message: `Token de impersonificação para ${targetUser.nome} gerado com sucesso!`,
        token,
        user: {
          id: targetUser.id,
          role: targetUser.role,
          nome: targetUser.nome
        }
      });

    } catch (error) {
      console.error('[POST /admin/users/:id/impersonate] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao realizar a impersonificação.' });
    }
  });

  // Rota 15: Edição e Moderação rápida de usuários
  router.patch('/users/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, nome, email, phone, telefone, category, atividadePrincipal, adminNotes } = req.body;

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: { profiles: true }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      }

      const updateUserData = {};
      if (nome !== undefined) updateUserData.nome = nome;
      if (name !== undefined) updateUserData.nome = name;
      if (email !== undefined) updateUserData.email = email;
      if (telefone !== undefined) updateUserData.telefone = telefone;
      if (phone !== undefined) updateUserData.telefone = phone;
      if (adminNotes !== undefined) updateUserData.adminNotes = adminNotes;

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateUserData,
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          adminNotes: true
        }
      });

      const targetCategory = category || atividadePrincipal;
      let updatedProfile = null;
      if (targetCategory && user.profiles && user.profiles.length > 0) {
        const profileId = user.profiles[0].id;
        updatedProfile = await prisma.profile.update({
          where: { id: profileId },
          data: { atividadePrincipal: targetCategory },
          select: {
            id: true,
            atividadePrincipal: true
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Dados do usuário atualizados com sucesso.',
        data: {
          user: updatedUser,
          profile: updatedProfile
        }
      });

    } catch (error) {
      console.error('[PATCH /admin/users/:id] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao atualizar dados do usuário.' });
    }
  });

  // Helper para exclusão assíncrona e segura no ImageKit
  const safeDeleteImageKit = async (fileId) => {
    if (!fileId) return;
    try {
      await imagekit.deleteFile(fileId);
      console.log(`[ImageKit] Imagem com fileId ${fileId} deletada com sucesso.`);
    } catch (err) {
      console.error(`[ImageKit Error] Falha ao deletar imagem ${fileId}:`, err.message || err);
    }
  };

  // Rota 16: Remoção rápida de mídia por moderação
  router.delete('/users/:id/media', checkAdmin, async (req, res) => {
    const { id } = req.params;
    const { type } = req.body;

    const validTypes = ['avatar', 'banner', 'sponsor'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `Tipo de mídia inválido. Use um de: ${validTypes.join(', ')}` });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: { profiles: true }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      }

      const profile = user.profiles?.[0];

      if (type === 'avatar') {
        if (user.profileImageFileId) {
          safeDeleteImageKit(user.profileImageFileId);
        }
        if (profile?.avatarFileId) {
          safeDeleteImageKit(profile.avatarFileId);
        }

        await prisma.user.update({
          where: { id },
          data: {
            profileImageUrl: null,
            profileImageFileId: null
          }
        });

        if (profile) {
          await prisma.profile.update({
            where: { id: profile.id },
            data: {
              avatarUrl: null,
              avatarFileId: null
            }
          });
        }

      } else if (type === 'banner') {
        if (!profile) {
          return res.status(400).json({ success: false, message: 'Este usuário não possui um perfil associado para conter um banner.' });
        }

        if (profile.capaFileId) {
          safeDeleteImageKit(profile.capaFileId);
        }

        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            capaUrl: null,
            capaFileId: null
          }
        });

      } else if (type === 'sponsor') {
        if (!profile) {
          return res.status(400).json({ success: false, message: 'Este usuário não possui um perfil associado para conter imagem comercial.' });
        }

        if (profile.fotoAnuncioFileId) {
          safeDeleteImageKit(profile.fotoAnuncioFileId);
        }

        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            fotoAnuncioUrl: null,
            fotoAnuncioFileId: null
          }
        });
      }

      res.status(200).json({
        success: true,
        message: `Mídia do tipo '${type}' removida com sucesso.`
      });

    } catch (error) {
      console.error('[DELETE /admin/users/:id/media] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao remover mídia.' });
    }
  });

  // Rota: Exclusão definitiva de usuário e dependências (com limpeza de mídias no ImageKit)
  router.delete('/users/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;

    try {
      // 1. Localizar o usuário e seus perfis com todas as mídias cadastrados no banco
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          profiles: true
        }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      }

      // Evitar que um admin delete a si próprio (boa prática de segurança)
      if (req.user && req.user.id === id) {
        return res.status(400).json({ success: false, message: 'Você não pode excluir o seu próprio usuário administrador.' });
      }

      // 2. Coletar IDs de mídia do ImageKit para exclusão segura
      const mediaFilesToDelete = [];
      if (user.profileImageFileId) {
        mediaFilesToDelete.push(user.profileImageFileId);
      }

      if (user.profiles && user.profiles.length > 0) {
        for (const profile of user.profiles) {
          if (profile.avatarFileId) mediaFilesToDelete.push(profile.avatarFileId);
          if (profile.capaFileId) mediaFilesToDelete.push(profile.capaFileId);
          if (profile.fotoAnuncioFileId) mediaFilesToDelete.push(profile.fotoAnuncioFileId);
        }
      }

      // 3. Excluir no ImageKit de forma assíncrona (não bloqueia a resposta da API)
      mediaFilesToDelete.forEach(fileId => {
        safeDeleteImageKit(fileId);
      });

      // 4. Executar transação no banco de dados para tratar o Cascade manualmente
      await prisma.$transaction(async (tx) => {
        const profileIds = user.profiles.map(p => p.id);

        if (profileIds.length > 0) {
          // Deletar serviços atrelados aos perfis
          await tx.service.deleteMany({
            where: { profileId: { in: profileIds } }
          });

          // Deletar denúncias (reports) atreladas aos perfis
          await tx.report.deleteMany({
            where: { adId: { in: profileIds } }
          });

          // Deletar reviews recebidos pelos perfis
          await tx.review.deleteMany({
            where: { profileId: { in: profileIds } }
          });

          // Deletar perfis
          await tx.profile.deleteMany({
            where: { userId: id }
          });
        }

        // Deletar reviews feitos pelo próprio usuário
        await tx.review.deleteMany({
          where: { authorId: id }
        });

        // Deletar notificações do usuário
        await tx.notification.deleteMany({
          where: { userId: id }
        });

        // Deletar solicitações de NFe do usuário
        await tx.nfeRequest.deleteMany({
          where: { userId: id }
        });

        // Finalmente deletar o usuário
        await tx.user.delete({
          where: { id }
        });
      });

      res.status(200).json({
        success: true,
        message: 'Usuário e todos os seus dados associados foram excluídos definitivamente.'
      });

    } catch (error) {
      console.error('[DELETE /admin/users/:id] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao realizar exclusão definitiva do usuário.' });
    }
  });

  // Rota 17: Resumo Financeiro (Soft Launch)
  router.get('/finance/summary', checkAdmin, async (req, res) => {
    try {
      const now = new Date();
      const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

      // Conta profissionais ativos com data de expiração vencida ou a menos de 5 dias
      const pendingRenewalsCount = await prisma.user.count({
        where: {
          planStatus: { in: ['ATIVO', 'BASICO'] },
          subscriptionEndsAt: {
            lt: fiveDaysFromNow
          }
        }
      });

      res.status(200).json({
        success: true,
        data: {
          totalRevenue: 0.00,
          pendingRenewalsCount
        }
      });

    } catch (error) {
      console.error('[GET /admin/finance/summary] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro interno ao buscar resumo financeiro.' });
    }
  });

  return router;
};
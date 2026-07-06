require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 5000;

// Rotas Importadas
const authMiddleware = require('./middleware/authMiddleware');
const sendEmail = require('./utils/sendEmail');
const { convertToInternationalPhone, getPhoneVariations } = require('./utils/phoneHelper');

// Configuração do CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://projeto-proita.vercel.app',
  'https://www.proita.com.br',
  'https://proita.com.br',
];

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex: Postman, curl)
    if (!origin) return callback(null, true);

    // Permite qualquer localhost (ex: 5173, 5174, 3000)
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuração do Banco de Dados Neon (PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Inicialização do Web Scraper do Mural
const { initScraper } = require('./services/scraper');
initScraper(prisma);

// Teste de conexão (opcional, só para logging)
if (process.env.DATABASE_URL) {
  pool.connect((err, client, release) => {
    if (err) {
      console.error('Erro ao conectar ao banco de dados:', err.stack);
    } else {
      console.log('Conectado ao banco de dados com sucesso.');
      release();
    }
  });
} else {
  console.log('Aviso: DATABASE_URL não configurada no .env. O banco não está conectado.');
}

// Rotas Base
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API do proITA rodando com sucesso!' });
});

// Rota Temporária de Migração de Planos para Contas de Teste
app.get('/api/admin/migrate-plans', async (req, res) => {
  try {
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const updated = await prisma.user.updateMany({
      data: {
        planStatus: 'ATIVO',
        subscriptionEndsAt: oneYearFromNow,
        trialEndsAt: null
      }
    });

    res.status(200).json({
      success: true,
      message: `Migração concluída com sucesso! ${updated.count} usuários foram migrados para o plano Patrocinador por 1 ano.`,
      count: updated.count
    });
  } catch (err) {
    console.error('Erro na migração de planos:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Rota de teste do banco de dados usando Prisma
app.get('/api/test-db', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.status(200).send('Conexão com Banco OK');
  } catch (error) {
    console.error('Erro na rota /api/test-db:', error);
    res.status(500).json({ error: 'Erro ao conectar com o banco de dados' });
  }
});

// Rota de Registro
app.post('/api/register', async (req, res) => {
  try {
    const { nome, sobrenome, telefone, isWhatsapp, senha } = req.body;

    // TRAVA DE SEGURANÇA: Exige telefone e senha
    if (!telefone || !senha) {
      return res.status(400).json({ success: false, message: 'Telefone e senha são obrigatórios.' });
    }

    const variations = getPhoneVariations(telefone);

    const existingUser = await prisma.user.findFirst({
      where: {
        telefone: { in: variations }
      }
    });

    if (existingUser) {
      // TRAVA DE CONFLITO GOOGLE: Se não tem senha, entrou pelo Google
      if (!existingUser.senha) {
        return res.status(409).json({
          success: false,
          conflitoGoogle: true,
          message: 'Este telefone já está vinculado a uma conta Google. Faça login pelo Google e adicione a senha no seu perfil.'
        });
      }
      return res.status(400).json({ success: false, message: 'Telefone já cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    const formattedPhone = convertToInternationalPhone(telefone);

    const newUser = await prisma.user.create({
      data: {
        nome,
        sobrenome,
        telefone: formattedPhone,
        isWhatsapp: isWhatsapp === true || isWhatsapp === 'true',
        senha: hashedPassword
      }
    });

    res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao cadastrar.' });
  }
});

// Rota de Login
app.post('/api/login', async (req, res) => {
  try {
    const { telefone, senha } = req.body;

    if (!telefone || !senha) {
      return res.status(400).json({ success: false, message: 'Telefone e senha são obrigatórios.' });
    }

    const variations = getPhoneVariations(telefone);

    console.log(`[Login] Buscando usuário: telefone="${telefone}", variações="${variations.join(', ')}"`);

    // Usa findFirst para procurar o usuário aceitando qualquer uma das variações de telefone
    const user = await prisma.user.findFirst({
      where: {
        telefone: { in: variations }
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuário ou senha inválido' });
    }

    // TRAVA DO GOOGLE: Tenta logar via senha numa conta só de Google
    if (!user.senha) {
      return res.status(403).json({
        success: false,
        message: 'Esta conta foi criada com o Google. Por favor, clique em "Entrar com o Google".'
      });
    }

    let isMatch = false;

    // Tenta comparar com bcrypt normalmente
    try {
      isMatch = await bcrypt.compare(senha, user.senha);
    } catch (bcryptErr) {
      console.log(`[Login] Erro ao comparar com bcrypt para utilizador ${user.id}`);
    }

    // Fallback: se bcrypt falhou (isMatch = false), verifica se a senha foi armazenada em texto plano
    if (!isMatch) {
      console.log(`[Login] Tentando fallback de texto plano para utilizador ${user.id}`);
      // Comparação estrita: senha enviada vs senha armazenada
      if (senha === user.senha) {
        // Senha em texto plano encontrada — permitir login e atualizar para hash bcrypt
        console.log(`[Login] Match em texto plano confirmado para utilizador ${user.id}. Migrando para bcrypt...`);
        isMatch = true;

        try {
          const newHash = await bcrypt.hash(senha, 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { senha: newHash }
          });
          console.log(`[Login] Senha do utilizador ${user.id} migrada com sucesso para bcrypt.`);
        } catch (hashErr) {
          console.error('[Login] Erro ao migrar senha para bcrypt:', hashErr);
          // Mesmo com erro no update, permite o login
        }
      } else {
        console.log(`[Login] Fallback de texto plano também falhou para utilizador ${user.id}`);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Usuário ou senha inválido' });
    }

    const secret = process.env.JWT_SECRET || 'chave_secreta_proita_123';
    const token = jwt.sign(
      { id: user.id, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        nome: user.nome,
        sobrenome: user.sobrenome,
        telefone: user.telefone,
        email: user.email || null,
        emailSecundario: user.emailSecundario || null,
        emailSecundarioVerificado: user.emailSecundarioVerificado || false,
        telefoneVerificado: user.telefoneVerificado || false,
        isPhoneVerified: user.telefoneVerificado || false,
        googleId: user.googleId || null,
        bairro: user.bairro,
        role: user.role,
        profileImageUrl: user.profileImageUrl || null,
        hasPassword: !!user.senha,
        planStatus: user.planStatus,
        trialEndsAt: user.trialEndsAt,
        subscriptionEndsAt: user.subscriptionEndsAt,
        planType: user.planType
      }
    });
  } catch (error) {
    console.error('Erro ao realizar login:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao realizar login.' });
  }
});

// Rota de Solicitar Recuperação de Senha (pública, sem authMiddleware)
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { identificador } = req.body;
    if (!identificador) {
      return res.status(400).json({ success: false, message: 'O e-mail ou telefone é obrigatório.' });
    }

    const variations = getPhoneVariations(identificador);
    console.log(`[forgot-password] Buscando usuário por: "${identificador}" / variações: "${variations.join(', ')}"`);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identificador },
          { telefone: { in: variations } }
        ]
      }
    });

    if (!user) {
      console.log(`[forgot-password] Usuário NÃO encontrado para: "${identificador}"`);
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    console.log(`[forgot-password] Usuário encontrado: id=${user.id}, email=${user.email || 'N/A'}, telefone=${user.telefone || 'N/A'}`);

    if (!user.email) {
      return res.status(400).json({ success: false, message: 'Conta sem e-mail cadastrado. Por favor, acione o suporte.' });
    }

    // Gerar código numérico de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 3600000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: { resetCode: code, resetCodeExpires: expires }
    });

    const emailResult = await sendEmail(
      user.email,
      'Recuperação de Senha - ProITA',
      `Seu código de recuperação é: ${code}`
    );

    if (emailResult.success) {
      res.status(200).json({ success: true, message: 'Código de recuperação enviado para o seu e-mail.' });
    } else {
      res.status(500).json({ success: false, message: 'Erro ao enviar o e-mail de recuperação.' });
    }
  } catch (error) {
    console.error('Erro no forgot-password:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao processar a requisição.' });
  }
});

// Rota de Redefinir Senha (pública, sem authMiddleware)
app.post('/api/reset-password', async (req, res) => {
  try {
    const { identificador, email, code, novaSenha } = req.body;
    const targetId = identificador || email;

    if (!targetId || !code || !novaSenha) {
      return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }

    if (!/^\d{6}$/.test(novaSenha)) {
      return res.status(400).json({ success: false, message: 'A nova senha deve conter exatamente 6 números.' });
    }

    const variations = getPhoneVariations(targetId);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: targetId },
          { telefone: { in: variations } }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    if (user.resetCode !== code || !user.resetCodeExpires || user.resetCodeExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Código inválido ou expirado.' });
    }

    const hashedPassword = await bcrypt.hash(novaSenha, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        senha: hashedPassword,
        resetCode: null,
        resetCodeExpires: null
      }
    });

    res.status(200).json({ success: true, message: 'Senha redefinida com sucesso!' });
  } catch (error) {
    console.error('Erro no reset-password:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao redefinir a senha.' });
  }
});

// Nova Rota: Login, Cadastro e Mesclagem via Google
app.post('/api/auth/google', async (req, res) => {
  try {
    const { email, googleId, nome, sobrenome, profileImageUrl, vincularTelefone } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ success: false, message: 'Dados do Google incompletos.' });
    }

    let user;

    // 1. Tenta achar o usuário pelo googleId
    user = await prisma.user.findUnique({ where: { googleId } });

    // 2. Se não achou pelo ID, tenta achar pelo Email para vincular
    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId }
        });
      }
    }

    // 3. Resolução de Conflito Manual (Vincular telefone)
    if (!user && vincularTelefone) {
      const variations = getPhoneVariations(vincularTelefone);
      user = await prisma.user.findFirst({
        where: { telefone: { in: variations } }
      });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, email, profileImageUrl }
        });
      }
    }

    // 4. Se não achou nenhuma conta vinculável, cria Nova Conta
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          nome: nome || 'Usuário',
          sobrenome: sobrenome || '',
          profileImageUrl: profileImageUrl || null
        }
      });
    }

    const secret = process.env.JWT_SECRET || 'chave_secreta_proita_123';
    const token = jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        nome: user.nome,
        sobrenome: user.sobrenome,
        telefone: user.telefone,
        email: user.email,
        emailSecundario: user.emailSecundario || null,
        emailSecundarioVerificado: user.emailSecundarioVerificado || false,
        telefoneVerificado: user.telefoneVerificado || false,
        isPhoneVerified: user.telefoneVerificado || false,
        bairro: user.bairro,
        role: user.role,
        profileImageUrl: user.profileImageUrl || null,
        hasPassword: !!user.senha,
        planStatus: user.planStatus,
        trialEndsAt: user.trialEndsAt,
        subscriptionEndsAt: user.subscriptionEndsAt,
        planType: user.planType
      }
    });
  } catch (error) {
    console.error('Erro na autenticação via Google:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao processar login com Google.' });
  }
});

// Rota para salvar ou remover o e-mail secundário do usuário
app.put('/api/user/email-secundario', async (req, res) => {
  try {
    const { userId, emailSecundario } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'O ID do usuário é obrigatório.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        emailSecundario: emailSecundario || null,
        emailSecundarioVerificado: false,
        emailSecundarioCode: null,
        emailSecundarioCodeExpires: null
      }
    });

    res.status(200).json({
      success: true,
      message: emailSecundario ? 'E-mail alternativo atualizado com sucesso!' : 'E-mail alternativo removido com sucesso!',
      user: {
        id: updatedUser.id,
        emailSecundario: updatedUser.emailSecundario,
        emailSecundarioVerificado: updatedUser.emailSecundarioVerificado
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar e-mail secundário:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao processar o e-mail alternativo.' });
  }
});

// Rota para solicitar verificação do e-mail secundário
app.post('/api/user/email-secundario/verify-request', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'O ID do usuário é obrigatório.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    if (!user.emailSecundario) {
      return res.status(400).json({ success: false, message: 'Não há e-mail alternativo cadastrado para verificar.' });
    }

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[TESTE LOCAL] Código OTP gerado: ${code}`);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailSecundarioCode: code,
        emailSecundarioCodeExpires: expires
      }
    });

    // Enviar por e-mail alternativo
    const emailResult = await sendEmail(
      user.emailSecundario,
      'Verificação de E-mail de Recuperação - ProITA',
      `Olá, ${user.nome}!
      
Seu código de verificação para o e-mail de recuperação é: ${code}

Este código expira em 15 minutos. Se você não solicitou esta verificação, por favor desconsidere este e-mail.`
    );

    if (emailResult.success) {
      res.status(200).json({ success: true, message: 'Código de verificação enviado!' });
    } else {
      res.status(500).json({ success: false, message: 'Erro ao enviar o e-mail de verificação.' });
    }
  } catch (error) {
    console.error('Erro na solicitação de verificação:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao processar solicitação.' });
  }
});

// Rota para confirmar o código de verificação do e-mail secundário
app.post('/api/user/email-secundario/verify-confirm', async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ success: false, message: 'Usuário e código são obrigatórios.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    if (user.emailSecundarioCode !== code || !user.emailSecundarioCodeExpires || user.emailSecundarioCodeExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Código de verificação inválido ou expirado.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        emailSecundarioVerificado: true,
        emailSecundarioCode: null,
        emailSecundarioCodeExpires: null
      }
    });

    res.status(200).json({
      success: true,
      message: 'E-mail alternativo verificado com sucesso!',
      user: {
        id: updatedUser.id,
        emailSecundario: updatedUser.emailSecundario,
        emailSecundarioVerificado: updatedUser.emailSecundarioVerificado
      }
    });
  } catch (error) {
    console.error('Erro na confirmação de verificação:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao confirmar verificação.' });
  }
});

// Rota para solicitar verificação do telefone celular (SMS/WhatsApp simulado)
app.post('/api/auth/send-verification-code', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'O número de telefone é obrigatório.' });
    }

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`\n======================================================`);
    console.log(`[VERIFICAÇÃO DE TELEFONE] Código OTP gerado para usuário ID: ${userId} (${phone})`);
    console.log(`--> CÓDIGO DE VERIFICAÇÃO: ${code}`);
    console.log(`======================================================\n`);

    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await prisma.user.update({
      where: { id: userId },
      data: {
        telefoneCodigo: code,
        telefoneCodigoExpires: expires
      }
    });

    res.status(200).json({ success: true, message: 'Código de verificação enviado com sucesso! Verifique o console do servidor.' });
  } catch (error) {
    console.error('Erro ao enviar código de verificação de telefone:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao processar solicitação.' });
  }
});

// Rota para confirmar o código de verificação do telefone celular
app.post('/api/auth/verify-code', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'O código de verificação é obrigatório.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    if (user.telefoneCodigo !== code || !user.telefoneCodigoExpires || user.telefoneCodigoExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Código de verificação inválido ou expirado.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        telefoneVerificado: true,
        telefoneCodigo: null,
        telefoneCodigoExpires: null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Telefone verificado com sucesso!',
      user: {
        id: updatedUser.id,
        telefone: updatedUser.telefone,
        telefoneVerificado: updatedUser.telefoneVerificado,
        isPhoneVerified: updatedUser.telefoneVerificado
      }
    });
  } catch (error) {
    console.error('Erro na confirmação de verificação de telefone:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao confirmar verificação.' });
  }
});

// Rota para atualizar os dados cadastrais (perfil) do usuário
app.put('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { nome, sobrenome, telefone, bairro, senha } = req.body;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    if (!nome || nome.trim() === '') {
      return res.status(400).json({ success: false, message: 'O nome é obrigatório.' });
    }

    if (telefone) {
      const variations = getPhoneVariations(telefone);
      const existingUserWithPhone = await prisma.user.findFirst({
        where: {
          telefone: { in: variations },
          id: { not: userId }
        }
      });
      if (existingUserWithPhone) {
        return res.status(400).json({ success: false, message: 'Este telefone / WhatsApp já está cadastrado por outro usuário.' });
      }
    }

    const formattedPhone = telefone ? convertToInternationalPhone(telefone) : null;

    let updateData = {
      nome: nome.trim(),
      sobrenome: sobrenome ? sobrenome.trim() : null,
      telefone: formattedPhone,
      bairro: bairro ? bairro.trim() : null
    };

    if (formattedPhone !== currentUser.telefone) {
      updateData.telefoneVerificado = false;
      updateData.telefoneCodigo = null;
      updateData.telefoneCodigoExpires = null;
    }

    if (senha !== undefined) {
      if (senha) {
        const regexNumeros = /^\d{6}$/;
        if (!regexNumeros.test(senha)) {
          return res.status(400).json({ success: false, message: 'A nova senha deve conter exatamente 6 números.' });
        }
        const hashedPassword = await bcrypt.hash(senha, 10);
        updateData.senha = hashedPassword;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso!',
      user: {
        id: updatedUser.id,
        nome: updatedUser.nome,
        sobrenome: updatedUser.sobrenome,
        telefone: updatedUser.telefone,
        bairro: updatedUser.bairro,
        email: updatedUser.email,
        emailSecundario: updatedUser.emailSecundario,
        emailSecundarioVerificado: updatedUser.emailSecundarioVerificado,
        telefoneVerificado: updatedUser.telefoneVerificado,
        isPhoneVerified: updatedUser.telefoneVerificado,
        profileImageUrl: updatedUser.profileImageUrl,
        googleId: updatedUser.googleId,
        role: updatedUser.role,
        hasPassword: !!updatedUser.senha
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil do usuário:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao atualizar perfil.' });
  }
});

// Rota para iniciar o período de testes (degustação) de 30 dias real no banco
app.post('/api/subscriptions/trial', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    // Se já está ativo ou degustação, evita reinício
    if (user.planStatus === 'ATIVO' || user.planStatus === 'DEGUSTACAO') {
      return res.status(400).json({ success: false, message: 'Você já possui um plano ativo ou em degustação.' });
    }

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        planStatus: 'DEGUSTACAO',
        trialEndsAt: expirationDate
      }
    });

    res.status(200).json({
      success: true,
      message: 'Período de degustação de 30 dias iniciado!',
      user: {
        id: updatedUser.id,
        nome: updatedUser.nome,
        sobrenome: updatedUser.sobrenome,
        telefone: updatedUser.telefone,
        email: updatedUser.email || null,
        emailSecundario: updatedUser.emailSecundario || null,
        emailSecundarioVerificado: updatedUser.emailSecundarioVerificado || false,
        telefoneVerificado: updatedUser.telefoneVerificado || false,
        isPhoneVerified: updatedUser.telefoneVerificado || false,
        googleId: updatedUser.googleId || null,
        bairro: updatedUser.bairro,
        role: updatedUser.role,
        profileImageUrl: updatedUser.profileImageUrl || null,
        hasPassword: !!updatedUser.senha,
        planStatus: updatedUser.planStatus,
        trialEndsAt: updatedUser.trialEndsAt,
        subscriptionEndsAt: updatedUser.subscriptionEndsAt
      }
    });
  } catch (error) {
    console.error('[POST /api/subscriptions/trial] Erro:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao iniciar degustação.' });
  }
});

// Rota para obter o perfil atualizado do usuário autenticado no banco
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        sobrenome: true,
        telefone: true,
        email: true,
        emailSecundario: true,
        emailSecundarioVerificado: true,
        telefoneVerificado: true,
        googleId: true,
        bairro: true,
        role: true,
        profileImageUrl: true,
        senha: true,
        planStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        createdAt: true,
        planType: true
      }
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        sobrenome: user.sobrenome,
        telefone: user.telefone,
        email: user.email || null,
        emailSecundario: user.emailSecundario || null,
        emailSecundarioVerificado: user.emailSecundarioVerificado || false,
        telefoneVerificado: user.telefoneVerificado || false,
        isPhoneVerified: user.telefoneVerificado || false,
        googleId: user.googleId || null,
        bairro: user.bairro,
        role: user.role,
        profileImageUrl: user.profileImageUrl || null,
        hasPassword: !!user.senha,
        planStatus: user.planStatus,
        trialEndsAt: user.trialEndsAt,
        subscriptionEndsAt: user.subscriptionEndsAt,
        createdAt: user.createdAt,
        planType: user.planType
      }
    });
  } catch (error) {
    console.error('[GET /api/auth/me] Erro:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
});

// Rota para excluir a conta do usuário (LGPD)
app.delete('/api/users/me', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Buscar todos os perfis (anúncios) do usuário
      const profiles = await tx.profile.findMany({
        where: { userId },
        select: { id: true }
      });
      const profileIds = profiles.map(p => p.id);

      if (profileIds.length > 0) {
        // 2. Deletar os serviços associados aos perfis
        await tx.service.deleteMany({
          where: { profileId: { in: profileIds } }
        });

        // 3. Deletar as avaliações (reviews) associadas aos perfis
        await tx.review.deleteMany({
          where: { profileId: { in: profileIds } }
        });
      }

      // 4. Deletar as avaliações escritas pelo próprio usuário (em perfis de terceiros)
      await tx.review.deleteMany({
        where: { authorId: userId }
      });

      // 5. Deletar os perfis (anúncios) do usuário
      await tx.profile.deleteMany({
        where: { userId }
      });

      // 6. Deletar o próprio usuário
      await tx.user.delete({
        where: { id: userId }
      });
    });

    res.status(200).json({ success: true, message: 'Conta e todos os dados associados foram excluídos com sucesso.' });
  } catch (error) {
    console.error('[DELETE /api/users/me] Erro ao excluir conta:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao processar a exclusão da conta.' });
  }
});

// Gatilho Manual do Scraper (Temporariamente Público para Testes no Mural)
app.post('/api/admin/scraper/run', async (req, res) => {
  try {
    const { scrapeOpportunities } = require('./services/scraper');
    const insertedCount = await scrapeOpportunities(prisma);
    res.status(200).json({ success: true, insertedCount });
  } catch (error) {
    console.error('[POST /api/admin/scraper/run] Erro ao rodar scraper manualmente:', error);
    res.status(500).json({ success: false, error: 'Erro ao rodar o scraper manualmente.' });
  }
});

// Rotas Administrativas
const adminRoutes = require('./routes/adminRoutes')(prisma);
app.use('/api/admin', authMiddleware, adminRoutes);

// Rotas de Notificações
const notificationRoutes = require('./routes/notificationRoutes')(prisma);
app.use('/api/notifications', authMiddleware, notificationRoutes);

// Rotas de Anúncios (Profile)
const adsRoutes = require('./routes/adsRoutes')(prisma);
app.use('/api/ads', adsRoutes);

// Rotas de Avaliações (Reviews)
const reviewRoutes = require('./routes/reviewRoutes')(prisma);
app.use('/api/reviews', reviewRoutes);

// Rota de Upload de Imagens (ImageKit)
const uploadRoutes = require('./routes/uploadRoutes')(prisma);
app.use('/api/upload', uploadRoutes);

// Rotas de Serviços (Catalog)
const serviceRoutes = require('./routes/serviceRoutes')(prisma);
app.use('/api/services', serviceRoutes);

// Rotas de Pagamentos (Banco Inter — PIX e Boleto)
const paymentRoutes = require('./routes/paymentRoutes')(prisma);
app.use('/api/payments', paymentRoutes);

// Rotas de Webhooks (Banco Inter — Conciliação Automática)
const webhookRoutes = require('./routes/webhookRoutes')(prisma);
app.use('/api/webhooks', webhookRoutes);

// Rotas de Contato (Nodemailer / Zoho SMTP)
const contactRoutes = require('./routes/contactRoutes')(prisma);
app.use('/api/contact', contactRoutes);


// Helper local de classificação caso o Gemini falhe (ex: API key expirada ou rede)
function localKeywordClassifier(description) {
  const desc = (description || '').toLowerCase();
  let categoriaGeral = "Outros Serviços";
  let atividadePrincipal = "Prestador de Serviços";
  let descricaoCurta = "Profissional dedicado a oferecer serviços de qualidade.";
  let biografiaCompleta = "Olá! Ofereço serviços especializados com foco em qualidade, pontualidade e satisfação do cliente. Entre em contato para conversarmos sobre suas necessidades e fazer um orçamento sem compromisso.";

  if (desc.includes("cano") || desc.includes("vazamento") || desc.includes("encanador") || desc.includes("hidraulica") || desc.includes("infiltração")) {
    categoriaGeral = "Reparos e Assistência Técnica";
    atividadePrincipal = "Encanador";
    descricaoCurta = "Especialista em reparos hidráulicos, vazamentos e desentupimentos.";
    biografiaCompleta = "Olá! Sou encanador profissional com anos de experiência no mercado. Trabalho com dedicação e agilidade para solucionar problemas de infiltrações, consertos de torneiras, válvulas, encanamentos em geral e desentupimento de pias e ralos. Atendimento rápido e garantido, sempre buscando a satisfação dos meus clientes com orçamentos justos.";
  } else if (desc.includes("eletricista") || desc.includes("energia") || desc.includes("fio") || desc.includes("tomada") || desc.includes("disjuntor") || desc.includes("elétrica")) {
    categoriaGeral = "Reparos e Assistência Técnica";
    atividadePrincipal = "Eletricista";
    descricaoCurta = "Soluções elétricas seguras para sua residência ou comércio.";
    biografiaCompleta = "Olá! Ofereço serviços de eletricista com máxima segurança e conformidade técnica. Realizo desde a troca de tomadas e chuveiros até reformas completas de quadros de distribuição, fiação e projetos de iluminação. Conte com um serviço limpo, organizado e focado na segurança do seu patrimônio e da sua família.";
  } else if (desc.includes("cabelo") || desc.includes("corte") || desc.includes("escova") || desc.includes("unha") || desc.includes("manicure") || desc.includes("pedicure") || desc.includes("estética") || desc.includes("maquiagem") || desc.includes("barba") || desc.includes("sobrancelha")) {
    categoriaGeral = "Beleza e Estética";
    atividadePrincipal = desc.includes("unha") || desc.includes("manicure") ? "Manicure e Pedicure" : (desc.includes("barba") || desc.includes("barbeiro") ? "Barbeiro" : "Cabeleireira");
    descricaoCurta = "Realçando sua beleza e bem-estar com atendimento personalizado.";
    biografiaCompleta = "Olá! Sou especialista em estética e bem-estar, dedicada a proporcionar a melhor experiência de cuidados pessoais para você. Utilizo produtos de alta qualidade e técnicas modernas para garantir um resultado incrível que eleva sua autoestima. Venha cuidar de você em um ambiente confortável ou no aconchego do seu lar.";
  } else if (desc.includes("bolo") || desc.includes("doce") || desc.includes("comida") || desc.includes("salgado") || desc.includes("buffet") || desc.includes("gastronomia") || desc.includes("cozinha") || desc.includes("salgados") || desc.includes("doces")) {
    categoriaGeral = "Alimentação e Gastronomia";
    atividadePrincipal = desc.includes("confeitaria") || desc.includes("bolo") || desc.includes("doce") ? "Confeiteira" : "Cozinheira";
    descricaoCurta = "Sabores inesquecíveis para seus momentos especiais.";
    biografiaCompleta = "Olá! Preparo alimentos com muito amor, higiene e ingredientes selecionados. Trabalho sob encomenda para festas, eventos ou consumo diário, com opções deliciosas que agradam a todos os paladares. Entre em contato para conhecer nosso cardápio e fazer seu pedido com antecedência!";
  } else if (desc.includes("obra") || desc.includes("reforma") || desc.includes("pedreiro") || desc.includes("pintor") || desc.includes("parede") || desc.includes("tijolo") || desc.includes("cimento") || desc.includes("azulejo") || desc.includes("gesso")) {
    categoriaGeral = "Construção e Reformas";
    atividadePrincipal = desc.includes("pintor") || desc.includes("pintura") ? "Pintor" : "Pedreiro";
    descricaoCurta = "Construindo e reformando seus sonhos com qualidade e confiança.";
    biografiaCompleta = "Olá! Atuo na área de construção e reformas oferecendo serviços de alta qualidade, acabamento impecável e respeito aos prazos combinados. Seja uma pequena reforma residencial ou uma grande obra comercial, conto com experiência para executar desde a fundação até os retoques de acabamento e pintura. Solicite um orçamento!";
  } else if (desc.includes("aula") || desc.includes("professor") || desc.includes("ensino") || desc.includes("matemática") || desc.includes("inglês") || desc.includes("português") || desc.includes("explicador") || desc.includes("tutoria")) {
    categoriaGeral = "Educação e Aulas";
    atividadePrincipal = "Professor Particular";
    descricaoCurta = "Aulas particulares personalizadas para o seu desenvolvimento acadêmico.";
    biografiaCompleta = "Olá! Ofereço suporte pedagógico e aulas particulares personalizadas para ajudar estudantes a superarem dificuldades escolares, se prepararem para exames ou aprenderem um novo idioma. Com metodologia dinâmica e foco nas necessidades individuais de cada aluno, garanto um aprendizado leve e eficiente.";
  } else if (desc.includes("limpeza") || desc.includes("diarista") || desc.includes("faxina") || desc.includes("passar") || desc.includes("lavar") || desc.includes("doméstica") || desc.includes("passadeira")) {
    categoriaGeral = "Serviços Domésticos e Cuidados";
    atividadePrincipal = "Diarista";
    descricaoCurta = "Organização e limpeza impecável para a sua casa ou escritório.";
    biografiaCompleta = "Olá! Presto serviços de limpeza e organização doméstica com total discrição, confiança e agilidade. Garanto um ambiente cheiroso, limpo e super agradável para você aproveitar seu tempo livre com o que realmente importa. Disponibilidade para diárias avulsas ou pacotes quinzenais e mensais.";
  } else if (desc.includes("cachorro") || desc.includes("gato") || desc.includes("pet") || desc.includes("banho") || desc.includes("tosa") || desc.includes("passeador")) {
    categoriaGeral = "Serviços Domésticos e Cuidados";
    atividadePrincipal = "Pet Sitter / Tosador(a)";
    descricaoCurta = "Cuidado amoroso e profissional para o seu melhor amigo de quatro patas.";
    biografiaCompleta = "Olá! Sou apaixonado por animais e ofereço serviços de Pet Sitter e passeios para cães e gatos. Cuido do seu pet com toda a atenção, carinho e responsabilidade que ele merece enquanto você trabalha ou viaja. Mantenho você atualizado com fotos e vídeos diários para sua total tranquilidade.";
  } else if (desc.includes("computador") || desc.includes("site") || desc.includes("desenvolvedor") || desc.includes("programador") || desc.includes("design") || desc.includes("logotipo") || desc.includes("marketing") || desc.includes("digital") || desc.includes("ti") || desc.includes("suporte")) {
    categoriaGeral = "Tecnologia e Design";
    atividadePrincipal = desc.includes("design") || desc.includes("logotipo") ? "Designer Gráfico" : "Desenvolvedor Web";
    descricaoCurta = "Transformando ideias em soluções digitais criativas e eficientes.";
    biografiaCompleta = "Olá! Auxilio empresas e profissionais liberais a se posicionarem de forma profissional no mundo digital. Desenvolvimento de websites modernos, identidades visuais marcantes, design para redes sociais e suporte em tecnologia com foco em gerar resultados e destacar sua marca no mercado.";
  } else if (desc.includes("frete") || desc.includes("mudança") || desc.includes("carreto") || desc.includes("transporte") || desc.includes("viagem") || desc.includes("motorista") || desc.includes("entregador") || desc.includes("motoboy")) {
    categoriaGeral = "Transporte e Logística";
    atividadePrincipal = desc.includes("mudança") || desc.includes("frete") || desc.includes("carreto") ? "Profissional de Mudanças" : "Motorista Particular";
    descricaoCurta = "Transporte seguro, pontual e com total responsabilidade.";
    biografiaCompleta = "Olá! Trabalho com serviços de carretos, mudanças e transportes em geral. Conto com veículo adequado e toda a dedicação para que seus pertences cheguem ao destino final de forma intacta e no horário combinado. Atendimento com responsabilidade e foco na segurança da sua carga.";
  } else if (desc.includes("médico") || desc.includes("fisioterapeuta") || desc.includes("massagem") || desc.includes("terapia") || desc.includes("psicólogo") || desc.includes("saúde") || desc.includes("dentista") || desc.includes("personal") || desc.includes("treino")) {
    categoriaGeral = "Saúde e Bem-estar";
    atividadePrincipal = desc.includes("massagem") || desc.includes("massoterapeuta") ? "Massoterapeuta" : (desc.includes("psicólogo") || desc.includes("terapia") ? "Terapeuta" : "Fisioterapeuta");
    descricaoCurta = "Promovendo saúde, equilíbrio e qualidade de vida para você.";
    biografiaCompleta = "Olá! Sou profissional da área da saúde e bem-estar, focado em oferecer tratamentos personalizados para alívio de dores, reabilitação física ou equilíbrio mental. Através de técnicas modernas e atendimento humanizado, ajudo você a conquistar uma rotina mais saudável e livre de limitações.";
  } else if (desc.includes("jardim") || desc.includes("grama") || desc.includes("planta") || desc.includes("poda") || desc.includes("paisagismo") || desc.includes("rural") || desc.includes("fazenda") || desc.includes("jardineiro")) {
    categoriaGeral = "Serviços Rurais e Paisagismo";
    atividadePrincipal = "Jardineiro";
    descricaoCurta = "Deixando seu jardim verdejante, saudável e sempre florido.";
    biografiaCompleta = "Olá! Ofereço serviços completos de jardinagem e paisagismo para residências, condomínios e chácaras. Realizo poda de árvores, corte de grama, plantio de mudas, controle de pragas e manutenção geral de canteiros. Transformo sua área externa em um espaço agradável e harmonioso com a natureza.";
  } else if (desc.includes("costura") || desc.includes("roupa") || desc.includes("ajuste") || desc.includes("conserto") || desc.includes("moda") || desc.includes("costureira") || desc.includes("alfaiate")) {
    categoriaGeral = "Moda e Costura";
    atividadePrincipal = "Costureira";
    descricaoCurta = "Ajustes precisos e confecções sob medida para valorizar seu estilo.";
    biografiaCompleta = "Olá! Sou costureira especializada em reformas de roupas, bainhas, ajustes de medidas, troca de zíperes e confecção de peças sob medida. Trabalho com fino acabamento e muito zelo por cada tecido, garantindo que suas roupas tenham o caimento perfeito e durem por muito mais tempo.";
  } else if (desc.includes("festa") || desc.includes("cerimonial") || desc.includes("decoração") || desc.includes("música") || desc.includes("dj") || desc.includes("show") || desc.includes("evento") || desc.includes("fotógrafo") || desc.includes("foto")) {
    categoriaGeral = "Eventos e Produção";
    atividadePrincipal = desc.includes("fotógrafo") || desc.includes("foto") ? "Fotógrafo" : "Produtor de Eventos";
    descricaoCurta = "Eternizando seus momentos mais felizes com profissionalismo.";
    biografiaCompleta = "Olá! Ajudo a transformar seu evento ou comemoração em um momento mágico e inesquecível. Desde a organização de cerimoniais até serviços artísticos como fotografia e música, coloco dedicação em cada detalhe para que você e seus convidados apenas desfrutem da festa.";
  }

  return { categoriaGeral, atividadePrincipal, descricaoCurta, biografiaCompleta };
}

// Configuração do Gemini (Chave inicializada dinamicamente por requisição)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ─────────────────────────────────────────────────────────────
// POST /api/reports — Central de Moderação: Registrar Denúncia
// ─────────────────────────────────────────────────────────────
app.post('/api/reports', async (req, res) => {
  try {
    const { adId, reason, details, reporterUserId } = req.body;

    if (!adId || !reason?.trim()) {
      return res.status(400).json({ success: false, message: 'O ID do anúncio e o motivo da denúncia são obrigatórios.' });
    }

    // Se motivo = 'Outros', o campo details é obrigatório
    if (reason.trim() === 'Outros' && !details?.trim()) {
      return res.status(400).json({ success: false, message: 'Por favor, descreva o motivo nos detalhes ao selecionar "Outros".' });
    }

    // Verifica se o anúncio existe
    const ad = await prisma.profile.findUnique({ where: { id: adId } });
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Anúncio não encontrado.' });
    }

    const report = await prisma.report.create({
      data: {
        adId,
        reason: reason.trim(),
        details: details?.trim() || null,
        reporterUserId: reporterUserId || null,
        status: 'pendente',
      },
    });

    res.status(201).json({ success: true, message: 'Denúncia registrada. Nossa equipe irá analisar em breve.', report });
  } catch (error) {
    console.error('[POST /api/reports] Erro:', error.message);
    res.status(500).json({ success: false, message: 'Erro interno ao registrar denúncia.' });
  }
});

// Rota de Análise de Descrição com IA

app.post('/api/analyze-description', authMiddleware, async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Descrição é obrigatória.' });
    }

    let parsedResult = null;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
      if (apiKey) {
        const dynamicGenAI = new GoogleGenerativeAI(apiKey);
        const model = dynamicGenAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Você é um assistente de categorização de serviços de alto nível. Leia a descrição do serviço a seguir.
        Identifique a ÚNICA PROFISSÃO PRINCIPAL (a especialidade dominante) e gere dois textos de marketing.
        
        REGRA ABSOLUTA DE CATEGORIZAÇÃO:
        Você é OBRIGADA a classificar o serviço em EXATAMENTE UMA destas categorias abaixo (copie o nome exato):
        - Alimentação e Gastronomia
        - Beleza e Estética
        - Construção e Reformas
        - Educação e Aulas
        - Eventos e Produção
        - Reparos e Assistência Técnica
        - Serviços Domésticos e Cuidados
        - Tecnologia e Design
        - Transporte e Logística
        - Saúde e Bem-estar
        - Serviços Rurais e Paisagismo
        - Moda e Costura
        - Turismo e Lazer
        - Serviços Administrativos e Consultoria
        - Outros Serviços
        
        Retorne um JSON estrito contendo quatro chaves:
        1. "categoriaGeral": O nome EXATO de uma das categorias da lista acima. Se não se encaixar em nenhuma, use "Outros Serviços".
        2. "atividadePrincipal": A profissão exata e principal (ex: Encanador, Fisioterapeuta, Vaqueiro, Digital Maker).
        3. "descricaoCurta": Uma frase de impacto com NO MÁXIMO 90 caracteres descrevendo o profissional.
        4. "biografiaCompleta": O texto de marketing persuasivo completo. Ele DEVE ser uma biografia concisa de exatamente e apenas 2 parágrafos curtos, em primeira pessoa.
        
        Apenas retorne o JSON, sem formatação Markdown.
        
        Descrição original do usuário: "${description}"`;

        const result = await model.generateContent(prompt);
        let text = result.response.text();

        // Sanitização do JSON conforme exigido
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Isolar o JSON se vier com texto extra para maior robustez
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }

        const jsonResult = JSON.parse(cleanText);
        const { categoriaGeral, atividadePrincipal, descricaoCurta, biografiaCompleta } = jsonResult;

        if (categoriaGeral && atividadePrincipal) {
          parsedResult = { categoriaGeral, atividadePrincipal, descricaoCurta, biografiaCompleta };
        }
      } else {
        throw new Error('Nenhuma chave de API do Gemini configurada.');
      }
    } catch (aiErr) {
      console.error("Erro no Gemini: ", aiErr);
    }

    // Se a IA falhou, usa o classificador local de palavras-chave
    if (!parsedResult) {
      parsedResult = localKeywordClassifier(description);
    }

    const { categoriaGeral, atividadePrincipal, descricaoCurta, biografiaCompleta } = parsedResult;

    // Auto-criação ou Busca no Banco de Dados
    // 1. Upsert da Categoria (busca pelo nome, cria se não existir)
    const categoryRecord = await prisma.category.upsert({
      where: { name: categoriaGeral },
      update: {},
      create: { name: categoriaGeral },
    });

    // 2. Upsert da Subcategoria (usando a atividadePrincipal identificada)
    const subcategoryRecord = await prisma.subcategory.upsert({
      where: { name: atividadePrincipal },
      update: {},
      create: {
        name: atividadePrincipal,
        categoryId: categoryRecord.id
      },
    });

    res.status(200).json({
      success: true,
      data: {
        category: categoryRecord,
        subcategory: subcategoryRecord,
        descricaoCurta: descricaoCurta || '',
        biografiaCompleta: biografiaCompleta || ''
      }
    });

  } catch (error) {
    console.error('Erro na análise da descrição:', error);
    res.status(500).json({ error: 'Erro interno ao processar a requisição com IA.' });
  }
});

// Rota para Transcrever Áudio usando Google Speech-to-Text
app.post('/api/transcribe', authMiddleware, async (req, res) => {
  try {
    const { audioContent } = req.body;
    if (!audioContent) {
      return res.status(400).json({ error: 'Conteúdo do áudio é obrigatório.' });
    }

    const apiKey = process.env.GOOGLE_SPEECH_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Chave de API do Google Speech-to-Text não configurada no servidor.' });
    }

    const response = await axios.post(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
      config: {
        encoding: 'WEBM_OPUS',
        languageCode: 'pt-BR'
      },
      audio: {
        content: audioContent
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const transcript = response.data.results?.[0]?.alternatives?.[0]?.transcript || '';
    res.status(200).json({ success: true, transcript });
  } catch (error) {
    console.error('Erro na transcrição de áudio:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    const errMsg = error.response?.data?.error?.message || error.message || 'Erro ao transcrever áudio.';
    res.status(status).json({ error: errMsg });
  }
});

// ── Rotas de Inteligência e Busca (Fase 3) ──

// Autocomplete de atividades principais (sem nomes de utilizadores)
app.get('/api/search/suggestions', async (req, res) => {
  try {
    const q = req.query.q || '';

    // Busca apenas o campo atividadePrincipal dos perfis que correspondam
    const profiles = await prisma.profile.findMany({
      where: {
        atividadePrincipal: { contains: q, mode: 'insensitive' }
      },
      select: {
        atividadePrincipal: true
      }
    });

    // Deduplica as atividades principais
    const seen = new Set();
    const suggestions = [];
    profiles.forEach(p => {
      const atividade = p.atividadePrincipal;
      if (atividade && !seen.has(atividade.toLowerCase())) {
        seen.add(atividade.toLowerCase());
        suggestions.push({ type: 'category', label: atividade });
      }
    });

    res.json({ success: true, data: suggestions.slice(0, 8) });
  } catch (err) {
    console.error('Erro autocomplete atividades:', err);
    res.status(500).json({ error: 'Erro ao buscar sugestões' });
  }
});

// Autocomplete de subcategorias (legado)
app.get('/api/subcategories/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const subcategories = await prisma.subcategory.findMany({
      where: {
        name: {
          contains: q,
          mode: 'insensitive'
        }
      },
      take: 5
    });
    res.json({ success: true, data: subcategories });
  } catch (err) {
    console.error('Erro autocomplete:', err);
    res.status(500).json({ error: 'Erro ao buscar subcategorias' });
  }
});

// Registrar histórico de busca
app.post('/api/search-history', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query inválida' });

    await prisma.searchHistory.upsert({
      where: { query: query.toLowerCase().trim() },
      update: { count: { increment: 1 } },
      create: { query: query.toLowerCase().trim() }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar busca' });
  }
});

// Obter histórico de buscas populares
app.get('/api/search-history/popular', async (req, res) => {
  try {
    const popular = await prisma.searchHistory.findMany({
      orderBy: { count: 'desc' },
      take: 4
    });
    res.json({ success: true, data: popular });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar histórico popular' });
  }
});

// Incrementar cliquesWhatsapp
app.post('/api/ads/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.profile.update({
      where: { id },
      data: { cliquesWhatsapp: { increment: 1 } }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao incrementar clique' });
  }
});

// Incrementar visitasPerfil
app.post('/api/ads/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.profile.update({
      where: { id },
      data: { visitasPerfil: { increment: 1 } }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao incrementar visita' });
  }
});

// Categorias Populares (agrupadas por atividadePrincipal)
app.get('/api/categories/popular', async (req, res) => {
  try {
    const popularCategories = await prisma.profile.groupBy({
      by: ['atividadePrincipal'],
      _count: {
        atividadePrincipal: true
      },
      orderBy: {
        _count: {
          atividadePrincipal: 'desc'
        }
      },
      take: 4
    });
    res.json({ success: true, data: popularCategories });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar categorias populares' });
  }
});

// Buscar oportunidades do mural (Neon DB raw SQL)
app.get('/api/mural', async (req, res) => {
  try {
    const opportunities = await prisma.$queryRaw`
      SELECT 
        id, 
        title, 
        description, 
        category, 
        source_name AS "sourceName", 
        source_url AS "sourceUrl", 
        published_date AS "publishedDate", 
        created_at AS "createdAt"
      FROM mural_oportunidades 
      ORDER BY published_date DESC
    `;
    res.json({ success: true, data: opportunities });
  } catch (err) {
    console.error('Erro ao buscar oportunidades do mural:', err);
    res.status(500).json({ error: 'Erro ao buscar oportunidades' });
  }
});

// Servir arquivos estáticos do frontend (Vite build) em produção
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Rota do sitemap.xml dinâmico para SEO
app.get('/sitemap.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  const now = new Date();

  let ads = [];
  try {
    ads = await prisma.profile.findMany({
      where: {
        user: {
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
      },
      select: {
        id: true,
        slug: true
      }
    });
  } catch (err) {
    console.error('[SITEMAP GENERATION] Erro ao buscar anúncios:', err);
  }

  // Constrói o XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.proita.com.br/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.proita.com.br/search</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.proita.com.br/planos</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.proita.com.br/faq</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.proita.com.br/sobre</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;

  // Adiciona as URLs dinâmicas dos perfis
  ads.forEach(ad => {
    const idOrSlug = ad.slug || ad.id;
    xml += `
  <url>
    <loc>https://www.proita.com.br/profile/${idOrSlug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  xml += '\n</urlset>';
  res.send(xml);
});

// Qualquer outra rota do cliente carrega a SPA
app.get('*any', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Iniciando o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
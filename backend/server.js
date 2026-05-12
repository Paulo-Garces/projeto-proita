require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 5000;

// Rotas Importadas
const authMiddleware = require('./middleware/authMiddleware');

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
app.use(express.json());

// Configuração do Banco de Dados Neon (PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

    const telefoneLimpo = telefone.replace(/\D/g, '');

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { telefone: telefone },
          { telefone: telefoneLimpo }
        ]
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

    const newUser = await prisma.user.create({
      data: {
        nome,
        sobrenome,
        telefone,
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

    // Limpa a formatação: remove parênteses, espaços e traços, deixando só números
    const telefoneLimpo = telefone.replace(/\D/g, '');

    // Usa findFirst para procurar o usuário aceitando tanto o formato com símbolos quanto o limpo
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { telefone: telefone },
          { telefone: telefoneLimpo }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
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
      return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
    }

    const secret = process.env.JWT_SECRET || 'chave_secreta_proita_123';
    const token = jwt.sign(
      { id: user.id, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    // Busca profileImageUrl diretamente do usuário (salvo pelo upload do Dashboard)
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        nome: user.nome,
        sobrenome: user.sobrenome,
        telefone: user.telefone,
        bairro: user.bairro,
        role: user.role,
        profileImageUrl: user.profileImageUrl || null,
      }
    });
  } catch (error) {
    console.error('Erro ao realizar login:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao realizar login.' });
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
      const telefoneLimpo = vincularTelefone.replace(/\D/g, '');
      user = await prisma.user.findFirst({
        where: { OR: [{ telefone: vincularTelefone }, { telefone: telefoneLimpo }] }
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
        bairro: user.bairro,
        role: user.role,
        profileImageUrl: user.profileImageUrl || null,
      }
    });
  } catch (error) {
    console.error('Erro na autenticação via Google:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao processar login com Google.' });
  }
});

// Rotas Administrativas
const adminRoutes = require('./routes/adminRoutes')(prisma);
app.use('/api/admin', authMiddleware, adminRoutes);

// Rotas de Anúncios (Profile)
const adsRoutes = require('./routes/adsRoutes')(prisma);
app.use('/api/ads', adsRoutes);

// Rota de Upload de Imagens (ImageKit)
const uploadRoutes = require('./routes/uploadRoutes')(prisma);
app.use('/api/upload', uploadRoutes);

// Configuração do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Rota de Análise de Descrição com IA
app.post('/api/analyze-description', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Descrição é obrigatória.' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
    4. "biografiaCompleta": O texto de marketing persuasivo completo (cerca de 2 a 3 parágrafos curtos, em primeira pessoa).
    
    Apenas retorne o JSON, sem formatação Markdown.
    
    Descrição original do usuário: "${description}"`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // Limpar formatação Markdown se a IA retornar (ex: ```json ... ```)
    text = text.replace(/```json\n?|\n?```/g, '').trim();

    const jsonResult = JSON.parse(text);
    const { categoriaGeral, atividadePrincipal, descricaoCurta, biografiaCompleta } = jsonResult;

    if (!categoriaGeral || !atividadePrincipal) {
      return res.status(500).json({ error: 'Falha ao analisar a descrição pela IA. Campos faltando.' });
    }

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

// ── Rotas de Inteligência e Busca (Fase 3) ──

// Autocomplete de atividades principais (sem nomes de utilizadores)
app.get('/api/search/suggestions', async (req, res) => {
  try {
    const q = req.query.q || '';
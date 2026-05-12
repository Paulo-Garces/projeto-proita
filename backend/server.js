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
    if (!origin) return callback(null, true);
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

// Teste de conexão
if (process.env.DATABASE_URL) {
  pool.connect((err, client, release) => {
    if (err) {
      console.error('Erro ao conectar ao banco de dados:', err.stack);
    } else {
      console.log('Conectado ao banco de dados com sucesso.');
      release();
    }
  });
}

// --- ROTAS BASE ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API do proITA rodando com sucesso!' });
});

app.get('/api/test-db', async (req, res) => {
  try {
    await prisma.user.count();
    res.status(200).send('Conexão com Banco OK');
  } catch (error) {
    console.error('Erro na rota /api/test-db:', error);
    res.status(500).json({ error: 'Erro ao conectar com o banco de dados' });
  }
});

// --- AUTENTICAÇÃO E REGISTRO ---

// Rota de Registro Tradicional
app.post('/api/register', async (req, res) => {
  try {
    const { nome, sobrenome, telefone, isWhatsapp, senha } = req.body;

    // Trava: Exige telefone e senha no cadastro manual
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
      // Se existe mas não tem senha, é uma conta Google que precisa ser vinculada
      if (!existingUser.senha) {
        return res.status(409).json({
          success: false,
          conflitoGoogle: true,
          message: 'Este telefone está vinculado a uma conta Google. Entre com Google para continuar.'
        });
      }
      return res.status(400).json({ success: false, message: 'Telefone já cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    await prisma.user.create({
      data: {
        nome,
        sobrenome,
        telefone: telefoneLimpo,
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

// Rota de Login Tradicional
app.post('/api/login', async (req, res) => {
  try {
    const { telefone, senha } = req.body;

    if (!telefone || !senha) {
      return res.status(400).json({ success: false, message: 'Telefone e senha são obrigatórios.' });
    }

    const telefoneLimpo = telefone.replace(/\D/g, '');

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

    // Trava: Impede login manual em conta que só tem Google
    if (!user.senha) {
      return res.status(403).json({
        success: false,
        message: 'Conta criada via Google. Clique em "Entrar com o Google".'
      });
    }

    let isMatch = await bcrypt.compare(senha, user.senha);

    // Fallback Texto Plano (Migração de dados antigos)
    if (!isMatch && senha === user.senha) {
      isMatch = true;
      const newHash = await bcrypt.hash(senha, 10);
      await prisma.user.update({ where: { id: user.id }, data: { senha: newHash } });
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
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

// Nova Rota: Login/Cadastro Google com Mesclagem
app.post('/api/auth/google', async (req, res) => {
  try {
    const { email, googleId, nome, sobrenome, profileImageUrl, vincularTelefone } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ success: false, message: 'Dados do Google incompletos.' });
    }

    let user;

    // 1. Busca por GoogleId
    user = await prisma.user.findUnique({ where: { googleId } });

    // 2. Busca por Email para vincular conta existente
    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, profileImageUrl: user.profileImageUrl || profileImageUrl }
        });
      }
    }

    // 3. Mesclagem via Telefone (se solicitado pelo frontend após conflito)
    if (!user && vincularTelefone) {
      const telLimpo = vincularTelefone.replace(/\D/g, '');
      user = await prisma.user.findFirst({ where: { OR: [{ telefone: vincularTelefone }, { telefone: telLimpo }] } });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, email, profileImageUrl: user.profileImageUrl || profileImageUrl }
        });
      }
    }

    // 4. Criação de nova conta se nada foi encontrado
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
        role: user.role,
        profileImageUrl: user.profileImageUrl || null,
      }
    });
  } catch (error) {
    console.error('Erro auth google:', error);
    res.status(500).json({ success: false, message: 'Erro no login Google.' });
  }
});

// --- ROTAS DE DOMÍNIO ---
const adminRoutes = require('./routes/adminRoutes')(prisma);
app.use('/api/admin', authMiddleware, adminRoutes);

const adsRoutes = require('./routes/adsRoutes')(prisma);
app.use('/api/ads', adsRoutes);

const uploadRoutes = require('./routes/uploadRoutes')(prisma);
app.use('/api/upload', uploadRoutes);

// --- INTELIGÊNCIA ARTIFICIAL (GEMINI) ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

app.post('/api/analyze-description', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'Descrição obrigatória.' });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analise a descrição e retorne um JSON estrito (sem markdown) com as chaves: 
    "categoriaGeral" (escolha entre: Alimentação e Gastronomia, Beleza e Estética, Construção e Reformas, Educação e Aulas, Eventos e Produção, Reparos e Assistência Técnica, Serviços Domésticos e Cuidados, Tecnologia e Design, Transporte e Logística, Saúde e Bem-estar, Serviços Rurais e Paisagismo, Moda e Costura, Turismo e Lazer, Serviços Administrativos e Consultoria, Outros Serviços),
    "atividadePrincipal" (nome da profissão), 
    "descricaoCurta" (impacto, max 90 char), 
    "biografiaCompleta" (persuasivo, 1ª pessoa).
    Descrição: "${description}"`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json\n?|\n?```/g, '').trim();
    const jsonResult = JSON.parse(text);

    const categoryRecord = await prisma.category.upsert({
      where: { name: jsonResult.categoriaGeral },
      update: {},
      create: { name: jsonResult.categoriaGeral },
    });

    const subcategoryRecord = await prisma.subcategory.upsert({
      where: { name: jsonResult.atividadePrincipal },
      update: {},
      create: { name: jsonResult.atividadePrincipal, categoryId: categoryRecord.id },
    });

    res.status(200).json({
      success: true,
      data: {
        category: categoryRecord,
        subcategory: subcategoryRecord,
        descricaoCurta: jsonResult.descricaoCurta,
        biografiaCompleta: jsonResult.biografiaCompleta
      }
    });
  } catch (error) {
    console.error('Erro IA:', error);
    res.status(500).json({ error: 'Erro ao processar IA.' });
  }
});

// --- BUSCA E MÉTRICAS ---

app.get('/api/search/suggestions', async (req, res) => {
  try {
    const q = req.query.q || '';
    const profiles = await prisma.profile.findMany({
      where: { atividadePrincipal: { contains: q, mode: 'insensitive' } },
      select: { atividadePrincipal: true },
      take: 20
    });
    const suggestions = [...new Set(profiles.map(p => p.atividadePrincipal))]
      .map(label => ({ type: 'category', label }));
    res.json({ success: true, data: suggestions.slice(0, 8) });
  } catch (err) {
    res.status(500).json({ error: 'Erro sugestões' });
  }
});

app.post('/api/search-history', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query vazia' });
    await prisma.searchHistory.upsert({
      where: { query: query.toLowerCase().trim() },
      update: { count: { increment: 1 } },
      create: { query: query.toLowerCase().trim() }
    });
    res.json({ success: true });
  } catch (err) { res.status(500).send(); }
});

app.get('/api/search-history/popular', async (req, res) => {
  try {
    const popular = await prisma.searchHistory.findMany({ orderBy: { count: 'desc' }, take: 4 });
    res.json({ success: true, data: popular });
  } catch (err) { res.status(500).send(); }
});

app.post('/api/ads/:id/click', async (req, res) => {
  try {
    await prisma.profile.update({ where: { id: req.params.id }, data: { cliquesWhatsapp: { increment: 1 } } });
    res.json({ success: true });
  } catch (err) { res.status(500).send(); }
});

app.post('/api/ads/:id/view', async (req, res) => {
  try {
    await prisma.profile.update({ where: { id: req.params.id }, data: { visitasPerfil: { increment: 1 } } });
    res.json({ success: true });
  } catch (err) { res.status(500).send(); }
});

app.get('/api/categories/popular', async (req, res) => {
  try {
    const popular = await prisma.profile.groupBy({
      by: ['atividadePrincipal'],
      _count: { atividadePrincipal: true },
      orderBy: { _count: { atividadePrincipal: 'desc' } },
      take: 4
    });
    res.json({ success: true, data: popular });
  } catch (err) { res.status(500).send(); }
});

app.listen(port, () => {
  console.log(`Servidor proITA rodando na porta ${port}`);
});
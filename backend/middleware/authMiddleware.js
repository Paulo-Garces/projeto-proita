const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // O token geralmente vem no cabeçalho Authorization no formato "Bearer TOKEN"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Acesso negado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifica e decodifica o token usando a chave secreta (ou um padrão se não houver no .env)
    const secret = process.env.JWT_SECRET || 'chave_secreta_proita_123';
    const decoded = jwt.verify(token, secret);
    
    // Anexa as informações do usuário no objeto de requisição
    req.user = decoded;
    
    next(); // Passa para o próximo middleware ou rota
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido ou expirado.' });
  }
};

module.exports = authMiddleware;

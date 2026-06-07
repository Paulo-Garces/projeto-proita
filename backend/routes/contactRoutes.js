const express = require('express');
const nodemailer = require('nodemailer');

module.exports = (prisma) => {
  const router = express.Router();

  // Limite de taxa básico em memória para proteção contra spam (1 contato por IP a cada 1 minuto)
  const rateLimitMap = new Map();
  const rateLimitMiddleware = (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    const lastRequestTime = rateLimitMap.get(ip);
    
    // 1 minuto de intervalo contra spam
    if (lastRequestTime && (now - lastRequestTime < 60 * 1000)) {
      const remainingSeconds = Math.ceil((60 * 1000 - (now - lastRequestTime)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Muitas mensagens enviadas. Por favor, aguarde mais ${remainingSeconds} segundos antes de tentar novamente.`
      });
    }
    
    rateLimitMap.set(ip, now);
    next();
  };

  // Configuração do transportador do Nodemailer usando Zoho Mail
  // Nota: Damos prioridade a ZOHO_USER/ZOHO_PASS, caindo de volta para SMTP_USER/SMTP_PASS caso existam
  const user = process.env.ZOHO_USER || process.env.SMTP_USER;
  const pass = process.env.ZOHO_PASS || process.env.SMTP_PASS;

  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true, // true para porta 465 (SSL/TLS)
    auth: {
      user: user,
      pass: pass
    }
  });

  // POST /api/contact — Rota de envio de mensagem de contato
  router.post('/', rateLimitMiddleware, async (req, res) => {
    const { nome, email, assunto, mensagem, tipo } = req.body;

    // Validações básicas de entrada
    if (!nome || !email || !assunto || !mensagem || !tipo) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos (nome, email, assunto, mensagem, tipo) são obrigatórios.'
      });
    }

    if (tipo !== 'suporte' && tipo !== 'comercial') {
      return res.status(400).json({
        success: false,
        message: "O campo tipo deve ser 'suporte' ou 'comercial'."
      });
    }

    // Validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, insira um e-mail válido.'
      });
    }

    // Definir destinatário conforme o tipo de contato
    const destinatario = tipo === 'suporte' ? 'suporte@proita.com.br' : 'contato@proita.com.br';
    const setorNome = tipo === 'suporte' ? 'Suporte Técnico' : 'Contato Comercial';

    const mailOptions = {
      from: `"Portal proITA" <${user}>`, // Remetente (Zoho exige que seja o usuário autenticado)
      to: destinatario,
      replyTo: email, // Permite que a equipe responda diretamente para o usuário
      subject: `[${setorNome.toUpperCase()}] ${assunto}`,
      text: `Mensagem de contato recebida pelo portal proITA.\n\nNome: ${nome}\nE-mail: ${email}\nSetor: ${setorNome}\nAssunto: ${assunto}\n\nMensagem:\n${mensagem}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #2563eb; margin-top: 0; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Novo Contato Recebido</h2>
          <p style="margin: 10px 0;"><strong>Nome:</strong> ${nome}</p>
          <p style="margin: 10px 0;"><strong>E-mail:</strong> ${email}</p>
          <p style="margin: 10px 0;"><strong>Setor:</strong> ${setorNome}</p>
          <p style="margin: 10px 0;"><strong>Assunto:</strong> ${assunto}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <h4 style="margin-bottom: 5px; color: #1e293b;">Mensagem:</h4>
          <p style="white-space: pre-wrap; background-color: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #f3f4f6; line-height: 1.6; color: #475569; margin-top: 5px;">${mensagem}</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({
        success: true,
        message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.'
      });
    } catch (error) {
      console.error('[POST /api/contact] Erro ao enviar e-mail via Nodemailer:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar o envio do e-mail. Por favor, tente novamente mais tarde.'
      });
    }
  });

  return router;
};

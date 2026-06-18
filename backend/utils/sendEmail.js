const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, html) => {
  try {
    const user = process.env.ZOHO_USER || process.env.SMTP_USER;
    const pass = process.env.ZOHO_PASS || process.env.SMTP_PASS;

    if (!user || !pass) {
      console.warn('[SMTP Warning] Credenciais de e-mail (ZOHO_USER/SMTP_USER ou ZOHO_PASS/SMTP_PASS) não foram encontradas no process.env!');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true, // true para 465, false para outras portas
      auth: {
        user: user,
        pass: pass,
      },
    });

    const mailOptions = {
      from: `"Portal proITA" <${user}>`, // o remetente deve ser o mesmo do usuário autenticado na Zoho
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail enviado: ', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar e-mail: ', error);
    return { success: false, error };
  }
};

module.exports = sendEmail;

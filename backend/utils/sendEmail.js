const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true, // true para 465, false para outras portas
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_USER, // o remetente deve ser o mesmo do usuário autenticado na Zoho
      to,
      subject,
      text,
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

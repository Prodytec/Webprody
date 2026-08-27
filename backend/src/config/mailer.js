const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('../utils/logger');

const isConfigured = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    })
  : null;

if (!isConfigured) {
  logger.warn('SMTP no configurado (ver .env.example). Los mensajes de contacto solo se guardarán localmente.');
}

async function sendContactNotification({ name, company, email, phone, users, message }) {
  if (!transporter) return { sent: false, reason: 'smtp-not-configured' };

  await transporter.sendMail({
    from: `"Sitio Prodytec" <${env.smtp.user}>`,
    to: env.contactToEmail,
    replyTo: email,
    subject: `Nueva consulta de ${company}`,
    text: [
      `Nombre: ${name}`,
      `Empresa: ${company}`,
      `Email: ${email}`,
      `Teléfono: ${phone || 'No informado'}`,
      `Usuarios: ${users || 'No informado'}`,
      '',
      message,
    ].join('\n'),
  });

  return { sent: true };
}

module.exports = { sendContactNotification, isConfigured };

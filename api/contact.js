const nodemailer = require('nodemailer');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readEnv() {
  return {
    contactToEmail: process.env.CONTACT_TO_EMAIL || 'consultas@prodytec.com',
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: Number(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  };
}

function validate({ name, company, email, message } = {}) {
  const errors = [];
  if (!name || !name.trim()) errors.push('El nombre es obligatorio.');
  if (!company || !company.trim()) errors.push('La empresa es obligatoria.');
  if (!email || !EMAIL_REGEX.test(email)) errors.push('El email no es válido.');
  if (!message || !message.trim()) errors.push('Contanos brevemente qué necesitás.');
  return errors;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Método no permitido.' });
  }

  const payload = req.body || {};

  // Honeypot: si un bot completa este campo oculto, respondemos OK sin enviar nada.
  if (payload.website) {
    return res.status(200).json({ message: 'Gracias por tu mensaje.' });
  }

  const errors = validate(payload);
  if (errors.length) {
    return res.status(400).json({ message: errors[0], errors });
  }

  const env = readEnv();
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    console.error('SMTP no configurado: faltan variables de entorno en el proyecto de Vercel.');
    return res.status(500).json({ message: 'El envío de emails no está configurado en el servidor.' });
  }

  const { name, company, email, phone, users, message } = payload;

  try {
    const transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });

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

    return res.status(201).json({ message: 'Gracias, recibimos tu consulta. Te contactamos a la brevedad.' });
  } catch (err) {
    console.error('Error enviando email de contacto:', err.message);
    return res.status(500).json({ message: 'No pudimos enviar tu mensaje. Probá nuevamente en unos minutos.' });
  }
};

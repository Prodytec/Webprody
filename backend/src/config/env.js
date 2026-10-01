require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  contactToEmail: process.env.CONTACT_TO_EMAIL || 'consultas@prodytec.com',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
  },
  admin: {
    // Si no se definen, se usan las credenciales por defecto de config/auth.js.
    user: process.env.ADMIN_USER || '',
    pass: process.env.ADMIN_PASS || '',
    sessionSecret: process.env.SESSION_SECRET || '',
  },
};

module.exports = env;

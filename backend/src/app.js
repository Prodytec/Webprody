const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const apiRoutes = require('./routes');
const { UPLOADS_DIR } = require('./services/image.service');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const FRONTEND_DIR = path.join(__dirname, '..', '..', 'frontend');

const app = express();

// Detrás de Nginx/Apache: necesario para que el rate limit y la cookie Secure vean la IP/protocolo reales.
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false, // el sitio carga fuentes/estilos inline puntuales; se ajusta por separado si se agrega CSP
  })
);
app.use(cors({ origin: env.corsOrigin }));
// Las imágenes del blog viajan como base64 en el JSON, por eso este límite mayor solo en esa ruta.
app.use('/api/posts', express.json({ limit: '6mb' }));
app.use(express.json());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// URLs antiguas de los artículos (antes eran páginas estáticas).
const LEGACY_ARTICLES = {
  '/blog-transformacion-digital-erp.html': 'transformacion-digital-erp',
  '/blog-paradigma-naranja.html': 'paradigma-naranja',
};
Object.entries(LEGACY_ARTICLES).forEach(([from, slug]) => {
  app.get(from, (req, res) => res.redirect(301, `/articulo.html?slug=${slug}`));
});

app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));
app.use(express.static(FRONTEND_DIR));

app.use('/api', apiRoutes);
app.use('/api', notFoundHandler);

app.use(errorHandler);

module.exports = app;

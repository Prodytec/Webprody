const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const FRONTEND_DIR = path.join(__dirname, '..', '..', 'frontend');

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false, // el sitio carga fuentes/estilos inline puntuales; se ajusta por separado si se agrega CSP
  })
);
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use(express.static(FRONTEND_DIR));

app.use('/api', apiRoutes);
app.use('/api', notFoundHandler);

app.use(errorHandler);

module.exports = app;

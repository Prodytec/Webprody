const logger = require('../utils/logger');

function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Recurso no encontrado.' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.too.large') err.publicMessage = 'El archivo es demasiado pesado.';
  const status = err.status || 500;
  if (status >= 500) logger.error(err);
  res.status(status).json({ message: err.publicMessage || 'Ocurrió un error inesperado en el servidor.' });
}

module.exports = { notFoundHandler, errorHandler };

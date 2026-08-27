const rateLimit = require('express-rate-limit');

const contactRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes. Probá nuevamente en unos minutos.' },
});

module.exports = { contactRateLimiter };

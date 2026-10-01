const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { status, login, logout } = require('../controllers/auth.controller');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Probá nuevamente en unos minutos.' },
});

const router = Router();

router.get('/', status);
router.post('/', loginLimiter, login);
router.delete('/', logout);

module.exports = router;

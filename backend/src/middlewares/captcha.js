const { verify } = require('../services/turnstile.service');

// Exige un token de Turnstile válido en el cuerpo (captchaToken) antes de seguir con el login o el contacto.
async function requireCaptcha(req, res, next) {
  try {
    const ok = await verify((req.body || {}).captchaToken, req.ip);
    if (!ok) return res.status(400).json({ message: 'No pudimos verificar que sos una persona. Completá la verificación e intentá de nuevo.' });
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireCaptcha };

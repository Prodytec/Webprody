const env = require('../config/env');
const logger = require('../utils/logger');

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
// Claves públicas de prueba de Cloudflare: solo para desarrollo local.
const TEST_KEYS = { siteKey: '1x00000000000000000000AA', secret: '1x0000000000000000000000000000000AA' };

const isProd = env.nodeEnv === 'production';
const configured = Boolean(env.turnstile.siteKey && env.turnstile.secret);

if (isProd && !configured) {
  logger.error('Captcha: faltan TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY. El login y el formulario de contacto quedan bloqueados.');
}

const keys = () => (configured ? env.turnstile : isProd ? null : TEST_KEYS);

const siteKey = () => (keys() || {}).siteKey || '';

const fail = (status, message) => Object.assign(new Error(message), { status, publicMessage: message });

async function verify(token, ip) {
  const k = keys();
  if (!k) throw fail(503, 'La verificación anti-bots no está configurada. Avisá al administrador del sitio.');
  if (!token || typeof token !== 'string' || token.length > 2048) return false;

  const body = new URLSearchParams({ secret: k.secret, response: token });
  if (ip) body.set('remoteip', ip);
  try {
    const res = await fetch(VERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    logger.error('Captcha: no se pudo contactar a Cloudflare:', err.message);
    throw fail(503, 'No pudimos verificar que sos una persona. Probá de nuevo en unos minutos.');
  }
}

module.exports = { verify, siteKey };

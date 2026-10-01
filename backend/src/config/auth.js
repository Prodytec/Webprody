const crypto = require('crypto');
const env = require('./env');

// Credenciales por defecto del panel (contraseña guardada como hash SHA-256, no en texto plano).
// Se pueden reemplazar con ADMIN_USER / ADMIN_PASS en el .env.
const DEFAULT_USER = 'prodytec';
const DEFAULT_PASS_HASH = '5e7bdf84f6ccc7d0d06eb07e18733167d29cbb9ef2b4a6ad2dd1e990e774496e';

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha256(a), sha256(b));

function checkCredentials(user, pass) {
  const userOk = safeEqual(user || '', env.admin.user || DEFAULT_USER);
  const passOk = env.admin.pass
    ? safeEqual(pass || '', env.admin.pass)
    : crypto.timingSafeEqual(sha256(pass || ''), Buffer.from(DEFAULT_PASS_HASH, 'hex'));
  return userOk && passOk;
}

// Sin SESSION_SECRET se genera uno al arrancar: las sesiones se pierden al reiniciar el servidor.
const secret = env.admin.sessionSecret || crypto.randomBytes(32).toString('hex');

module.exports = { checkCredentials, secret };

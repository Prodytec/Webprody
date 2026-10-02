const crypto = require('crypto');
const { secret } = require('../config/auth');

const COOKIE = 'prody_admin';
const SESSION_HOURS = 12;
const REMEMBER_DAYS = 30;

const sign = (payload) => crypto.createHmac('sha256', secret).update(payload).digest('base64url');

function readSession(req) {
  const raw = (req.headers.cookie || '').split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return null;
  const [payload, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

function cookie(req, value, maxAgeSeconds) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  return `${COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}${secure}`;
}

function startSession(req, res, user, remember = false) {
  const seconds = (remember ? REMEMBER_DAYS * 24 : SESSION_HOURS) * 3600;
  const payload = Buffer.from(JSON.stringify({ u: user, exp: Date.now() + seconds * 1000 })).toString('base64url');
  res.setHeader('Set-Cookie', cookie(req, `${payload}.${sign(payload)}`, seconds));
}

const endSession = (req, res) => res.setHeader('Set-Cookie', cookie(req, '', 0));

module.exports = { readSession, startSession, endSession };

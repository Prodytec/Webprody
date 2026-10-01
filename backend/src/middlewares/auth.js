const { readSession } = require('../services/session.service');

function requireAdmin(req, res, next) {
  if (!readSession(req)) return res.status(401).json({ message: 'Tu sesión expiró. Volvé a ingresar.' });
  next();
}

module.exports = { requireAdmin };

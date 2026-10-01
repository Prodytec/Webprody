const { checkCredentials } = require('../config/auth');
const { readSession, startSession, endSession } = require('../services/session.service');

function status(req, res) {
  const session = readSession(req);
  res.json({ authenticated: Boolean(session), user: session ? session.u : null });
}

function login(req, res) {
  const { user, password } = req.body || {};
  if (!checkCredentials(user, password)) {
    return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
  }
  startSession(req, res, user);
  res.json({ authenticated: true, user });
}

function logout(req, res) {
  endSession(req, res);
  res.json({ authenticated: false });
}

module.exports = { status, login, logout };

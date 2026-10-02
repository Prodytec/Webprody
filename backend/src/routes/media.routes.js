const express = require('express');
const { requireAdmin } = require('../middlewares/auth');
const { saveMedia } = require('../services/media.service');

const router = express.Router();

// El archivo viaja como cuerpo binario; la sesión se valida antes de leerlo.
router.post('/', requireAdmin, express.raw({ type: () => true, limit: '61mb' }), async (req, res, next) => {
  try {
    res.status(201).json({ url: await saveMedia(req.body, req.query.kind) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

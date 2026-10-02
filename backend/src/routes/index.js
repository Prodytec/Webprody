const { Router } = require('express');
const contactRoutes = require('./contact.routes');
const postRoutes = require('./post.routes');
const mediaRoutes = require('./media.routes');
const authRoutes = require('./auth.routes');

const { siteKey } = require('../services/turnstile.service');

const router = Router();

// Clave pública del captcha para el frontend.
router.get('/captcha', (req, res) => res.json({ siteKey: siteKey() }));

router.use('/contact', contactRoutes);
router.use('/posts', postRoutes);
router.use('/media', mediaRoutes);
router.use('/login', authRoutes);

module.exports = router;

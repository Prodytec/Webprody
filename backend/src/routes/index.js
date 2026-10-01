const { Router } = require('express');
const contactRoutes = require('./contact.routes');
const postRoutes = require('./post.routes');
const authRoutes = require('./auth.routes');

const router = Router();

router.use('/contact', contactRoutes);
router.use('/posts', postRoutes);
router.use('/login', authRoutes);

module.exports = router;

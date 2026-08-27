const { Router } = require('express');
const contactRoutes = require('./contact.routes');

const router = Router();

router.use('/contact', contactRoutes);

module.exports = router;

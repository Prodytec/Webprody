const { Router } = require('express');
const { createContact } = require('../controllers/contact.controller');
const { validateContactPayload } = require('../middlewares/validate');
const { contactRateLimiter } = require('../middlewares/rateLimiter');

const router = Router();

router.post('/', contactRateLimiter, validateContactPayload, createContact);

module.exports = router;

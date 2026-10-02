const { Router } = require('express');
const { createContact } = require('../controllers/contact.controller');
const { validateContactPayload } = require('../middlewares/validate');
const { contactRateLimiter } = require('../middlewares/rateLimiter');
const { requireCaptcha } = require('../middlewares/captcha');

const router = Router();

router.post('/', contactRateLimiter, validateContactPayload, requireCaptcha, createContact);

module.exports = router;

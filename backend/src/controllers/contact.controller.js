const contactService = require('../services/contact.service');

async function createContact(req, res, next) {
  try {
    await contactService.submitContact(req.body);
    res.status(201).json({ message: 'Gracias, recibimos tu consulta. Te contactamos a la brevedad.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createContact };

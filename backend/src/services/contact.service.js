const contactRepository = require('../repositories/contact.repository');
const mailer = require('../config/mailer');
const logger = require('../utils/logger');

async function submitContact(payload) {
  const { name, company, email, phone, users, message } = payload;

  const record = await contactRepository.save({ name, company, email, phone, users, message });

  try {
    await mailer.sendContactNotification({ name, company, email, phone, users, message });
  } catch (err) {
    // La consulta ya quedó guardada: un fallo de email no debe romper la respuesta al usuario.
    logger.error('No se pudo enviar el email de notificación de contacto:', err.message);
  }

  return record;
}

module.exports = { submitContact };

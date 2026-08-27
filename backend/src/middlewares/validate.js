const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactPayload(req, res, next) {
  const { name, company, email, message, website } = req.body || {};

  // Honeypot: bots tend to fill every field, humans never see this one.
  if (website) {
    return res.status(200).json({ message: 'Gracias por tu mensaje.' });
  }

  const errors = [];
  if (!name || !name.trim()) errors.push('El nombre es obligatorio.');
  if (!company || !company.trim()) errors.push('La empresa es obligatoria.');
  if (!email || !EMAIL_REGEX.test(email)) errors.push('El email no es válido.');
  if (!message || !message.trim()) errors.push('Contanos brevemente qué necesitás.');

  if (errors.length) {
    return res.status(400).json({ message: errors[0], errors });
  }

  next();
}

module.exports = { validateContactPayload };

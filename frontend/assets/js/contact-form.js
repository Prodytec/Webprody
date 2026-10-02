/**
 * Wires the contact form to the backend API (POST /api/contact).
 * Kept separate from main.js so pages without a form don't load it.
 */
(function () {
  function setLoading(form, isLoading) {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    btn.disabled = isLoading;
    btn.textContent = isLoading ? 'Enviando...' : 'Enviar mensaje';
  }

  function showFeedback(form, type, message) {
    const feedback = form.querySelector('.form-feedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.remove('success', 'error');
    feedback.classList.add(type, 'is-visible');
  }

  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const captchaReady = Captcha.mount(document.getElementById('contactCaptcha'));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const captcha = await captchaReady;
      if (!captcha.token()) {
        showFeedback(form, 'error', 'Completá la verificación anti-bots antes de enviar.');
        return;
      }
      setLoading(form, true);

      const payload = Object.fromEntries(new FormData(form).entries());
      delete payload['cf-turnstile-response'];
      payload.captchaToken = captcha.token();

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'No pudimos enviar tu mensaje.');
        }

        showFeedback(form, 'success', '¡Gracias! Recibimos tu consulta y te vamos a contactar a la brevedad.');
        form.reset();
      } catch (err) {
        showFeedback(form, 'error', err.message || 'Ocurrió un error. Probá nuevamente o escribinos por WhatsApp.');
      } finally {
        captcha.reset(); // cada token sirve una sola vez
        setLoading(form, false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initContactForm);
})();

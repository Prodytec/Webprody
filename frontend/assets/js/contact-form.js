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

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setLoading(form, true);

      const payload = Object.fromEntries(new FormData(form).entries());

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
        setLoading(form, false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initContactForm);
})();

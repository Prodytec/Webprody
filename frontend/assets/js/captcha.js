/**
 * Captcha Cloudflare Turnstile. Captcha.mount(elemento) dibuja el widget y devuelve
 * { token(), reset() }. El token se envía al backend como captchaToken.
 */
const Captcha = (function () {
  let scriptReady = null;

  function loadScript() {
    if (!scriptReady) {
      scriptReady = new Promise((resolve, reject) => {
        window.__turnstileLoaded = resolve;
        const s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__turnstileLoaded';
        s.async = true;
        s.onerror = () => reject(new Error('No se pudo cargar la verificación anti-bots.'));
        document.head.appendChild(s);
      });
    }
    return scriptReady;
  }

  async function mount(container) {
    try {
      const [{ siteKey }] = await Promise.all([fetch('/api/captcha').then((r) => r.json()), loadScript()]);
      if (!siteKey) throw new Error('Captcha no configurado.');
      const id = window.turnstile.render(container, { sitekey: siteKey, language: 'es' });
      return { token: () => window.turnstile.getResponse(id) || '', reset: () => window.turnstile.reset(id) };
    } catch (err) {
      container.textContent = 'No se pudo cargar la verificación anti-bots. Recargá la página e intentá de nuevo.';
      return { token: () => '', reset: () => {} };
    }
  }

  return { mount };
})();

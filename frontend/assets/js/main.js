/**
 * Shared front-end behaviour: loads header/footer partials, wires up
 * navigation, scroll reveal, stat counters, accordions and back-to-top.
 */
(function () {
  const PARTIALS = {
    'header-placeholder': '/partials/header.html',
    'footer-placeholder': '/partials/footer.html',
  };

  async function loadPartials() {
    const entries = Object.entries(PARTIALS)
      .map(([id]) => document.getElementById(id) && id)
      .filter(Boolean);

    await Promise.all(
      entries.map(async (id) => {
        const el = document.getElementById(id);
        const res = await fetch(PARTIALS[id]);
        el.outerHTML = await res.text();
      })
    );
  }

  function initHeader() {
    const header = document.getElementById('siteHeader');
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('navDesktop');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('no-scroll', isOpen);
      });

      nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
          document.body.classList.remove('no-scroll');
        });
      });
    }

    const current = document.body.dataset.page;
    if (current) {
      const activeLink = header.querySelector(`[data-nav="${current}"]`);
      if (activeLink) activeLink.classList.add('is-active');
    }

    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    items.forEach((item) => observer.observe(item));
  }

  function animateCounter(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = (target % 1 === 0 ? Math.round(value) : value.toFixed(1)).toLocaleString('es-AR') + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  function initAccordions() {
    document.querySelectorAll('.accordion-item').forEach((item) => {
      const trigger = item.querySelector('.accordion-trigger');
      const panel = item.querySelector('.accordion-panel');
      if (!trigger || !panel) return;

      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');

        item.parentElement.querySelectorAll('.accordion-item.is-open').forEach((openItem) => {
          if (openItem !== item) {
            openItem.classList.remove('is-open');
            openItem.querySelector('.accordion-panel').style.maxHeight = null;
          }
        });

        item.classList.toggle('is-open', !isOpen);
        panel.style.maxHeight = !isOpen ? `${panel.scrollHeight}px` : null;
      });
    });
  }

  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener(
      'scroll',
      () => {
        btn.classList.toggle('is-visible', window.scrollY > 500);
      },
      { passive: true }
    );

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initFilterPills() {
    document.querySelectorAll('[data-filter-group]').forEach((group) => {
      const pills = group.querySelectorAll('.filter-pill');
      const targetSelector = group.dataset.filterGroup;
      const items = document.querySelectorAll(targetSelector);

      pills.forEach((pill) => {
        pill.addEventListener('click', () => {
          pills.forEach((p) => p.classList.remove('is-active'));
          pill.classList.add('is-active');
          const filter = pill.dataset.filter;

          items.forEach((item) => {
            const matches = filter === 'all' || item.dataset.category === filter;
            item.style.display = matches ? '' : 'none';
          });
        });
      });
    });
  }

  async function init() {
    await loadPartials();
    initHeader();
    initReveal();
    initCounters();
    initAccordions();
    initBackToTop();
    initFilterPills();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

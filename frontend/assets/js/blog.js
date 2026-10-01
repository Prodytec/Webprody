/**
 * Blog público: renderiza el listado (blog.html) y el artículo (articulo.html) desde /api/posts.
 * También expone BlogRender.bodyToHtml para que el panel admin muestre la misma vista previa.
 */
const BlogRender = (function () {
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Formato: párrafos separados por línea en blanco; "## " título; "- " lista; "> " cita.
  function bodyToHtml(text) {
    return String(text)
      .replace(/\r\n/g, '\n')
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        const lines = block.split('\n');
        if (block.startsWith('## ')) return `<h2>${esc(block.slice(3))}</h2>`;
        if (lines.every((l) => l.startsWith('- '))) {
          return `<ul>${lines.map((l) => `<li>${esc(l.slice(2))}</li>`).join('')}</ul>`;
        }
        if (block.startsWith('> ')) return `<blockquote>${esc(lines.map((l) => l.replace(/^> ?/, '')).join(' '))}</blockquote>`;
        return `<p>${lines.map(esc).join('<br>')}</p>`;
      })
      .join('\n');
  }

  const coverStyle = (post) => (post.image ? `style="background-image:url('${esc(post.image)}')"` : '');

  async function fetchJson(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  }

  const ARROW =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';

  async function renderList(container) {
    try {
      const posts = await fetchJson('/api/posts');
      if (!posts.length) {
        container.innerHTML = '<p class="blog-empty">Todavía no hay artículos publicados.</p>';
        return;
      }
      container.innerHTML = posts
        .map(
          (p) => `
        <article class="blog-card is-visible">
          <div class="blog-thumb ${p.image ? 'has-image' : ''}" ${coverStyle(p)}></div>
          <div class="blog-content">
            <span class="blog-meta">${esc(p.category)} · ${esc(p.minutes)} min</span>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.excerpt)}</p>
            <a href="/articulo.html?slug=${encodeURIComponent(p.slug)}" class="read-more">Leer más ${ARROW}</a>
          </div>
        </article>`
        )
        .join('');
    } catch {
      container.innerHTML = '<p class="blog-empty">No pudimos cargar los artículos. Probá de nuevo en unos minutos.</p>';
    }
  }

  async function renderArticle() {
    const slug = new URLSearchParams(location.search).get('slug');
    const root = document.getElementById('articleRoot');
    try {
      if (!slug) throw new Error('404');
      const p = await fetchJson(`/api/posts?slug=${encodeURIComponent(slug)}`);
      document.title = `${p.title} | Blog Prodytec`;
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.content = p.excerpt;
      root.innerHTML = `
        <section class="article-hero">
          <div class="container">
            <div class="breadcrumb"><a href="/">Inicio</a> / <a href="/blog.html">Blog</a> / ${esc(p.title)}</div>
            <span class="eyebrow">${esc(p.category)}</span>
            <h1 class="page-title" style="max-width: 30ch;">${esc(p.title)}</h1>
            <span class="blog-meta">${esc(p.author)} · ${esc(p.minutes)} min de lectura</span>
            <div class="article-cover ${p.image ? 'has-image' : ''}" ${coverStyle(p)}></div>
          </div>
        </section>
        <section class="section">
          <div class="container">
            <div class="article-body">${bodyToHtml(p.body)}</div>
            <div class="article-footer-nav">
              <a href="/blog.html" class="btn btn-ghost">← Volver al blog</a>
              <a href="/contacto.html" class="btn btn-primary">Hablar con un especialista</a>
            </div>
          </div>
        </section>`;
    } catch {
      root.innerHTML = `
        <section class="article-hero">
          <div class="container">
            <h1 class="page-title">Artículo no encontrado</h1>
            <p class="page-lead">Puede que haya sido eliminado o que el enlace sea incorrecto.</p>
            <a href="/blog.html" class="btn btn-primary">Volver al blog</a>
          </div>
        </section>`;
    }
  }

  return { bodyToHtml, esc, renderList, renderArticle };
})();

document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('blogList');
  if (list) BlogRender.renderList(list);
  if (document.getElementById('articleRoot')) BlogRender.renderArticle();
});

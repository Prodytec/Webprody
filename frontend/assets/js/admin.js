/** Panel de administración del blog: login, listado, alta, edición y baja de artículos. */
(function () {
  const $ = (id) => document.getElementById(id);
  const { esc, bodyToHtml } = BlogRender;
  const views = { login: $('loginView'), list: $('listView'), edit: $('editView') };

  let posts = [];
  let editing = null; // artículo en edición (null = nuevo)
  let newImage = null; // data URL de la imagen recién elegida
  let removeImage = false;

  function show(name) {
    Object.entries(views).forEach(([key, el]) => (el.hidden = key !== name));
    window.scrollTo({ top: 0 });
  }

  function feedback(el, message, type) {
    el.textContent = message || '';
    el.className = `form-feedback ${type || ''} ${message ? 'is-visible' : ''}`;
  }

  async function api(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && url !== '/api/login') {
      show('login');
      throw new Error(data.message || 'Tu sesión expiró.');
    }
    if (!res.ok) throw new Error(data.message || 'Ocurrió un error.');
    return data;
  }

  /* ---------- Listado ---------- */
  async function loadList() {
    posts = await api('/api/posts');
    $('postList').innerHTML = posts.length
      ? posts
          .map(
            (p) => `
        <div class="admin-row">
          <div class="admin-row-thumb" ${p.image ? `style="background-image:url('${esc(p.image)}')"` : ''}></div>
          <div>
            <h3>${esc(p.title)}</h3>
            <small>${esc(p.category)} · ${new Date(p.date).toLocaleDateString('es-AR')}</small>
          </div>
          <div class="admin-row-actions">
            <a class="btn btn-ghost" href="/articulo.html?slug=${encodeURIComponent(p.slug)}" target="_blank" rel="noopener">Ver</a>
            <button class="btn btn-ghost" data-edit="${esc(p.id)}" type="button">Editar</button>
            <button class="btn btn-danger" data-delete="${esc(p.id)}" type="button">Eliminar</button>
          </div>
        </div>`
          )
          .join('')
      : '<p class="admin-sub">No hay artículos. Creá el primero con “Nuevo artículo”.</p>';
  }

  async function showList(message) {
    show('list');
    feedback($('listFeedback'), message, 'success');
    try {
      await loadList();
    } catch (err) {
      feedback($('listFeedback'), err.message, 'error');
    }
  }

  $('postList').addEventListener('click', async (e) => {
    const editId = e.target.dataset.edit;
    const deleteId = e.target.dataset.delete;
    if (editId) openEditor(posts.find((p) => p.id === editId));
    if (deleteId) {
      const post = posts.find((p) => p.id === deleteId);
      if (!confirm(`¿Eliminar “${post.title}”? Esta acción no se puede deshacer.`)) return;
      try {
        await api(`/api/posts?id=${encodeURIComponent(deleteId)}`, { method: 'DELETE' });
        await showList('Artículo eliminado.');
      } catch (err) {
        feedback($('listFeedback'), err.message, 'error');
      }
    }
  });

  /* ---------- Editor ---------- */
  function renderImagePreview() {
    const src = newImage || (!removeImage && editing && editing.image) || null;
    $('imagePreview').hidden = !src;
    if (src) $('imageImg').src = src;
  }

  function openEditor(post) {
    editing = post || null;
    newImage = null;
    removeImage = false;
    $('editTitle').textContent = post ? 'Editar artículo' : 'Nuevo artículo';
    $('fTitle').value = post ? post.title : '';
    $('fCategory').value = post ? post.category : '';
    $('fMinutes').value = post ? post.minutes : 3;
    $('fAuthor').value = post ? post.author : 'Equipo Prodytec';
    $('fExcerpt').value = post ? post.excerpt : '';
    $('fBody').value = post ? post.body : '';
    $('fImage').value = '';
    $('bodyPreview').innerHTML = bodyToHtml($('fBody').value);
    feedback($('editFeedback'), '');
    renderImagePreview();
    show('edit');
  }

  // Achica la imagen (máx. 1600px) para no superar el límite de subida del servidor.
  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(img.src);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      img.src = URL.createObjectURL(file);
    });
  }

  $('fImage').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      newImage = await resizeImage(file);
      removeImage = false;
      renderImagePreview();
    } catch (err) {
      feedback($('editFeedback'), err.message, 'error');
    }
  });

  $('removeImage').addEventListener('click', () => {
    newImage = null;
    removeImage = true;
    $('fImage').value = '';
    renderImagePreview();
  });

  $('fBody').addEventListener('input', () => {
    $('bodyPreview').innerHTML = bodyToHtml($('fBody').value);
  });

  $('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = $('saveBtn');
    saveBtn.disabled = true;
    feedback($('editFeedback'), 'Guardando…');
    try {
      await api('/api/posts', {
        method: editing ? 'PUT' : 'POST',
        body: {
          id: editing && editing.id,
          title: $('fTitle').value,
          category: $('fCategory').value,
          minutes: $('fMinutes').value,
          author: $('fAuthor').value,
          excerpt: $('fExcerpt').value,
          body: $('fBody').value,
          newImage,
          removeImage,
        },
      });
      await showList(editing ? 'Artículo actualizado.' : 'Artículo publicado.');
    } catch (err) {
      feedback($('editFeedback'), err.message, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });

  $('newBtn').addEventListener('click', () => openEditor(null));
  $('backBtn').addEventListener('click', () => showList());
  $('cancelBtn').addEventListener('click', () => showList());

  /* ---------- Sesión ---------- */
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback($('loginError'), '');
    try {
      await api('/api/login', { method: 'POST', body: { user: $('loginUser').value.trim(), password: $('loginPass').value } });
      $('loginPass').value = '';
      await showList();
    } catch (err) {
      feedback($('loginError'), err.message, 'error');
    }
  });

  $('logoutBtn').addEventListener('click', async () => {
    await api('/api/login', { method: 'DELETE' });
    show('login');
  });

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const session = await api('/api/login');
      session.authenticated ? await showList() : show('login');
    } catch {
      show('login');
    }
  });
})();

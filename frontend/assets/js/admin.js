/** Panel de administración del blog: login, listado, alta, edición y baja de artículos. */
(function () {
  const $ = (id) => document.getElementById(id);
  const { esc, renderBody } = BlogRender;
  const views = { login: $('loginView'), list: $('listView'), edit: $('editView') };

  let posts = [];
  let editing = null; // artículo en edición (null = nuevo)
  let newImage = null; // data URL de la imagen recién elegida
  let removeImage = false;

  function show(name) {
    Object.entries(views).forEach(([key, el]) => (el.hidden = key !== name));
    if (name === 'login') ensureCaptcha();
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
            (p, i) => `
        <div class="admin-row">
          <div class="admin-row-thumb" ${p.image ? `style="background-image:url('${esc(p.image)}')"` : ''}></div>
          <div>
            <h3>${esc(p.title)}</h3>
            <small>${esc(p.category)} · ${new Date(p.date).toLocaleDateString('es-AR')}</small>
          </div>
          <div class="admin-row-actions">
            <button class="btn btn-ghost" data-move="up" data-id="${esc(p.id)}" type="button" title="Subir" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn btn-ghost" data-move="down" data-id="${esc(p.id)}" type="button" title="Bajar" aria-label="Bajar" ${i === posts.length - 1 ? 'disabled' : ''}>↓</button>
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
    const move = e.target.dataset.move;
    if (move) {
      const from = posts.findIndex((p) => p.id === e.target.dataset.id);
      const to = move === 'up' ? from - 1 : from + 1;
      if (from < 0 || to < 0 || to >= posts.length) return;
      const ids = posts.map((p) => p.id);
      [ids[from], ids[to]] = [ids[to], ids[from]];
      try {
        await api('/api/posts/order', { method: 'POST', body: { ids } });
        await loadList();
      } catch (err) {
        feedback($('listFeedback'), err.message, 'error');
      }
      return;
    }
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
    $('fBody').innerHTML = post ? renderBody(post.body) : '';
    $('fImage').value = '';
    feedback($('editFeedback'), '');
    renderImagePreview();
    show('edit');
  }

  // Achica la imagen (máx. 1600px) para no superar el límite de subida del servidor.
  function resizeImage(file, asBlob) {
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
        if (asBlob) canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen.'))), 'image/jpeg', 0.85);
        else resolve(canvas.toDataURL('image/jpeg', 0.85));
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


  $('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (uploading) return feedback($('editFeedback'), 'Esperá a que termine de subirse el archivo.', 'error');
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
          body: $('fBody').innerHTML,
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

  /* ---------- Editor de contenido (texto enriquecido) ---------- */
  const editor = $('fBody');
  const toolbar = $('rteToolbar');
  let uploading = 0;
  let savedRange = null;
  let mediaKind = null;

  const inEditor = (node) => node && editor.contains(node);

  function restoreSelection() {
    editor.focus();
    if (!savedRange) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
  }

  function exec(command, value) {
    restoreSelection();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('defaultParagraphSeparator', false, 'p');
    document.execCommand(command, false, value);
  }

  const withScheme = (url) => (/^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`);

  // Convierte un enlace de YouTube/Vimeo en su URL para incrustar (o null si no es válido).
  function embedUrl(raw) {
    let u;
    try {
      u = new URL(withScheme(raw.trim()));
    } catch {
      return null;
    }
    const host = u.hostname.replace(/^www\./, '');
    let id = null;
    if (host === 'youtu.be') id = u.pathname.slice(1);
    else if (host === 'youtube.com' || host === 'm.youtube.com') {
      id = u.searchParams.get('v') || (/^\/(embed|shorts|live)\/([\w-]+)/.exec(u.pathname) || [])[2];
    } else if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      id = (/(\d+)\/?$/.exec(u.pathname) || [])[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return id && /^[\w-]{6,20}$/.test(id) ? `https://www.youtube.com/embed/${id}` : null;
  }

  function insertMedia(html) {
    exec('insertHTML', `<p>${html}</p><p><br></p>`);
  }

  async function uploadMedia(file, kind) {
    uploading++;
    $('saveBtn').disabled = true;
    feedback($('editFeedback'), 'Subiendo archivo…');
    try {
      let body = file;
      if (kind === 'image' && file.type !== 'image/gif') body = await resizeImage(file, true);
      const res = await fetch(`/api/media?kind=${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        show('login');
        throw new Error(data.message || 'Tu sesión expiró.');
      }
      if (!res.ok) throw new Error(data.message || 'No se pudo subir el archivo.');
      insertMedia(
        {
          image: `<img src="${data.url}" alt="">`,
          video: `<video src="${data.url}" controls></video>`,
          audio: `<audio src="${data.url}" controls></audio>`,
        }[kind]
      );
      feedback($('editFeedback'), '');
    } catch (err) {
      feedback($('editFeedback'), err.message, 'error');
    } finally {
      uploading--;
      if (!uploading) $('saveBtn').disabled = false;
    }
  }

  const ACCEPT = {
    image: 'image/jpeg,image/png,image/webp,image/gif',
    video: 'video/mp4,video/webm',
    audio: 'audio/mpeg,audio/ogg,audio/wav,audio/mp4,audio/x-m4a',
  };

  // Recuerda dónde estaba el cursor para aplicar el formato aunque el foco pase a la barra.
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (!sel.rangeCount || !inEditor(sel.anchorNode)) return;
    savedRange = sel.getRangeAt(0).cloneRange();
    // El selector de estilo de párrafo refleja el bloque donde está el cursor.
    const el = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
    const block = el && el.closest('h2, h3, h4, p, blockquote, li');
    const tag = block && ['h2', 'h3'].includes(block.tagName.toLowerCase()) ? block.tagName.toLowerCase() : 'p';
    toolbar.querySelector('[data-select="block"]').value = tag;
  });

  // Los botones no deben quitarle el foco (ni la selección) al editor.
  toolbar.addEventListener('mousedown', (e) => {
    if (!e.target.closest('select, input')) e.preventDefault();
  });

  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cmd], [data-media]');
    if (!btn) return;
    if (btn.dataset.media) {
      mediaKind = btn.dataset.media;
      $('mediaFile').accept = ACCEPT[mediaKind];
      $('mediaFile').click();
      return;
    }
    const cmd = btn.dataset.cmd;
    if (cmd === 'quote') return exec('formatBlock', '<blockquote>');
    if (cmd === 'link') {
      const url = prompt('Dirección del enlace (ej. https://prodytec.com):');
      if (!url || !url.trim()) return;
      const href = esc(withScheme(url.trim()));
      return !savedRange || savedRange.collapsed
        ? exec('insertHTML', `<a href="${href}">${esc(url.trim())}</a>`)
        : exec('createLink', withScheme(url.trim()));
    }
    if (cmd === 'embed') {
      const raw = prompt('Pegá el enlace del video de YouTube o Vimeo:');
      if (!raw) return;
      const src = embedUrl(raw);
      return src
        ? insertMedia(`<iframe src="${src}" allowfullscreen></iframe>`)
        : feedback($('editFeedback'), 'El enlace no parece ser de YouTube ni de Vimeo.', 'error');
    }
    exec(cmd);
  });

  toolbar.addEventListener('change', (e) => {
    const select = e.target.closest('select[data-select]');
    if (select) {
      const value = select.value;
      if (value) {
        if (select.dataset.select === 'block') exec('formatBlock', `<${value}>`);
        else exec(select.dataset.select, value);
      }
      if (select.dataset.select !== 'block') select.value = '';
      return;
    }
    if (e.target.id === 'rteColor') exec('foreColor', e.target.value);
  });

  $('mediaFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (file && mediaKind) uploadMedia(file, mediaKind);
  });

  // Clic sobre una imagen/video/audio: lo selecciona para poder borrarlo con Suprimir.
  editor.addEventListener('click', (e) => {
    if (!e.target.matches('img, video, audio')) return;
    const range = document.createRange();
    range.selectNode(e.target);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  });

  // Pegar una imagen desde el portapapeles la sube como archivo propio.
  editor.addEventListener('paste', (e) => {
    const file = [...(e.clipboardData ? e.clipboardData.files : [])].find((f) => f.type.startsWith('image/'));
    if (!file) return;
    e.preventDefault();
    uploadMedia(file, 'image');
  });

  /* ---------- Sesión ---------- */
  let captcha = null;
  const ensureCaptcha = async () => {
    if (!captcha) captcha = await Captcha.mount($('loginCaptcha'));
    return captcha;
  };

  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback($('loginError'), '');
    const widget = await ensureCaptcha();
    if (!widget.token()) return feedback($('loginError'), 'Completá la verificación anti-bots.', 'error');
    try {
      await api('/api/login', {
        method: 'POST',
        body: {
          user: $('loginUser').value.trim(),
          password: $('loginPass').value,
          remember: $('loginRemember').checked,
          captchaToken: widget.token(),
        },
      });
      $('loginPass').value = '';
      await showList();
    } catch (err) {
      feedback($('loginError'), err.message, 'error');
    } finally {
      widget.reset(); // cada token sirve una sola vez
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

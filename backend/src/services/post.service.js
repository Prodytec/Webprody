const crypto = require('crypto');
const repo = require('../repositories/post.repository');
const { saveImage, deleteImage } = require('./image.service');
const { sanitizeBody, hasContent, uploadRefs } = require('./html.service');

const fail = (status, message) => Object.assign(new Error(message), { status, publicMessage: message });

const slugify = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'articulo';

async function uniqueSlug(title, ownId) {
  const base = slugify(title);
  let slug = base;
  for (let n = 2; await repo.slugExists(slug, ownId); n++) slug = `${base}-${n}`;
  return slug;
}

function clean(input) {
  const title = String(input.title || '').trim();
  const body = sanitizeBody(input.body).trim();
  const category = String(input.category || '').trim() || 'General';
  const excerpt = String(input.excerpt || '').trim();
  const minutes = Math.min(Math.max(parseInt(input.minutes, 10) || 3, 1), 120);
  const author = String(input.author || '').trim().slice(0, 60) || 'Equipo Prodytec';

  if (!title) throw fail(400, 'El título es obligatorio.');
  if (title.length > 150) throw fail(400, 'El título es muy largo (máximo 150 caracteres).');
  if (!hasContent(body)) throw fail(400, 'El contenido es obligatorio.');
  if (category.length > 60) throw fail(400, 'La categoría es muy larga.');
  if (excerpt.length > 300) throw fail(400, 'El resumen es muy largo (máximo 300 caracteres).');
  return { title, body, category, excerpt, minutes, author };
}

const list = () => repo.findAll();

async function getBySlug(slug) {
  const post = await repo.findBySlug(slug);
  if (!post) throw fail(404, 'Artículo no encontrado.');
  return post;
}

// Borra los archivos subidos que ya no usa ningún artículo.
async function releaseMedia(oldBody) {
  const refs = uploadRefs(oldBody);
  if (!refs.length) return;
  const inUse = (await repo.findAll()).map((p) => `${p.body} ${p.image || ''}`).join(' ');
  await Promise.all(refs.filter((r) => !inUse.includes(r)).map(deleteImage));
}

async function create(input) {
  const data = clean(input);
  const image = input.newImage ? await saveImage(input.newImage) : null;
  return repo.insert({ id: crypto.randomUUID(), slug: await uniqueSlug(data.title), ...data, image });
}

async function update(id, input) {
  const current = await repo.findById(id);
  if (!current) throw fail(404, 'Artículo no encontrado.');
  const data = clean(input);

  let image = current.image;
  if (input.newImage) image = await saveImage(input.newImage);
  else if (input.removeImage) image = null;

  const slug = current.title === data.title ? current.slug : await uniqueSlug(data.title, id);
  const updated = await repo.update(id, { ...data, slug, image });
  if (image !== current.image) await deleteImage(current.image);
  await releaseMedia(current.body);
  return updated;
}

async function remove(id) {
  const current = await repo.findById(id);
  if (!current) throw fail(404, 'Artículo no encontrado.');
  await repo.remove(id);
  await deleteImage(current.image);
  await releaseMedia(current.body);
}

async function reorder(ids) {
  if (!Array.isArray(ids) || !ids.length) throw fail(400, 'Orden inválido.');
  const existing = (await repo.findAll()).map((p) => p.id);
  const valid = ids.length === existing.length && new Set(ids).size === ids.length && ids.every((id) => existing.includes(id));
  if (!valid) throw fail(400, 'La lista cambió; recargá e intentá de nuevo.');
  await repo.reorder(ids);
}

module.exports = { list, getBySlug, create, update, remove, reorder };

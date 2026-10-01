const pool = require('../config/db');
const { ensureSchema } = require('../db/schema');

const toPost = (r) => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  category: r.category,
  minutes: r.minutes,
  excerpt: r.excerpt,
  body: r.body,
  image: r.image,
  author: r.author,
  date: new Date(r.created_at).toISOString(),
  updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
});

async function query(sql, params) {
  await ensureSchema();
  const [rows] = await pool.query(sql, params);
  return rows;
}

const findAll = async () => (await query('SELECT * FROM posts ORDER BY created_at DESC')).map(toPost);

async function findBySlug(slug) {
  const rows = await query('SELECT * FROM posts WHERE slug = ?', [slug]);
  return rows[0] ? toPost(rows[0]) : null;
}

async function findById(id) {
  const rows = await query('SELECT * FROM posts WHERE id = ?', [id]);
  return rows[0] ? toPost(rows[0]) : null;
}

async function slugExists(slug, ignoreId) {
  const rows = await query('SELECT 1 FROM posts WHERE slug = ? AND id <> ?', [slug, ignoreId || '']);
  return rows.length > 0;
}

async function insert(p) {
  await query(
    'INSERT INTO posts (id, slug, title, category, minutes, excerpt, body, image, author, created_at) VALUES (?,?,?,?,?,?,?,?,?,NOW())',
    [p.id, p.slug, p.title, p.category, p.minutes, p.excerpt, p.body, p.image, p.author]
  );
  return findById(p.id);
}

async function update(id, p) {
  await query(
    'UPDATE posts SET slug=?, title=?, category=?, minutes=?, excerpt=?, body=?, image=?, author=?, updated_at=NOW() WHERE id=?',
    [p.slug, p.title, p.category, p.minutes, p.excerpt, p.body, p.image, p.author, id]
  );
  return findById(id);
}

const remove = (id) => query('DELETE FROM posts WHERE id = ?', [id]);

module.exports = { findAll, findBySlug, findById, slugExists, insert, update, remove };

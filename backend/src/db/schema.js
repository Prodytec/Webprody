const pool = require('../config/db');
const seed = require('./seed');
const logger = require('../utils/logger');

let ready = null;

async function setup() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id         VARCHAR(36)  NOT NULL PRIMARY KEY,
      slug       VARCHAR(90)  NOT NULL UNIQUE,
      title      VARCHAR(150) NOT NULL,
      category   VARCHAR(60)  NOT NULL,
      minutes    SMALLINT     NOT NULL DEFAULT 3,
      excerpt    VARCHAR(300) NOT NULL DEFAULT '',
      body       MEDIUMTEXT   NOT NULL,
      image      VARCHAR(255) NULL,
      author     VARCHAR(60)  NOT NULL,
      created_at DATETIME     NOT NULL,
      updated_at DATETIME     NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  // Orden manual del listado (menor = más arriba). Migra tablas creadas antes de esta columna.
  const [cols] = await pool.query("SHOW COLUMNS FROM posts LIKE 'sort_order'");
  if (!cols.length) {
    await pool.query('ALTER TABLE posts ADD COLUMN sort_order INT NOT NULL DEFAULT 0');
    await pool.query('SET @n := 0');
    await pool.query('UPDATE posts SET sort_order = (@n := @n + 1) ORDER BY created_at DESC');
  }

  // Los artículos originales se cargan una sola vez, cuando la tabla está vacía.
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM posts');
  if (total === 0) {
    for (const p of seed) {
      await pool.query(
        'INSERT INTO posts (id, slug, title, category, minutes, excerpt, body, image, author, created_at, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [p.id, p.slug, p.title, p.category, p.minutes, p.excerpt, p.body, p.image, p.author, new Date(p.date), seed.indexOf(p) + 1]
      );
    }
    logger.info('Blog: artículos iniciales cargados en la base de datos.');
  }
}

// Se ejecuta una sola vez; si falla (ej. base apagada) se reintenta en la próxima consulta.
function ensureSchema() {
  if (!ready) {
    ready = setup().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

module.exports = { ensureSchema };

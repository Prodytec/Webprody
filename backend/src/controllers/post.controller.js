const service = require('../services/post.service');

// Express 4 no captura errores de handlers async: los pasamos a next().
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

module.exports = {
  list: wrap(async (req, res) => {
    res.json(req.query.slug ? await service.getBySlug(req.query.slug) : await service.list());
  }),
  create: wrap(async (req, res) => res.status(201).json(await service.create(req.body || {}))),
  update: wrap(async (req, res) => res.json(await service.update((req.body || {}).id, req.body || {}))),
  remove: wrap(async (req, res) => {
    await service.remove(req.query.id);
    res.json({ ok: true });
  }),
};

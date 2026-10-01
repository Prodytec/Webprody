const { Router } = require('express');
const ctrl = require('../controllers/post.controller');
const { requireAdmin } = require('../middlewares/auth');

const router = Router();

// Lectura pública; escritura solo con sesión de admin.
router.get('/', ctrl.list);
router.post('/', requireAdmin, ctrl.create);
router.put('/', requireAdmin, ctrl.update);
router.delete('/', requireAdmin, ctrl.remove);

module.exports = router;

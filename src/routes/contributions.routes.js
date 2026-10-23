const router = require('express').Router();
const ctrl = require('../controllers/contributions.controller');
const { validateContribution } = require('../middleware/validate');

router.post('/', validateContribution, ctrl.create);
router.get('/summary', ctrl.summary);

module.exports = router;

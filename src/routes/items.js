const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', itemController.getAll);
router.get('/:id', itemController.getById);
router.post('/', itemController.create);
router.put('/:id', itemController.update);
router.post('/:id/adjust', itemController.adjustStock);
router.post('/:id/sale', itemController.recordSale);

module.exports = router;

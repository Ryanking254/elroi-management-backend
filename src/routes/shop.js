const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', shopController.getShop);
router.patch('/currency', shopController.updateCurrency);

module.exports = router;
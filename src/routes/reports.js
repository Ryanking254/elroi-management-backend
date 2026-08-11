const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/daily', reportController.getDaily);
router.get('/summary', reportController.getSummary);

module.exports = router;

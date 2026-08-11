const express = require('express');
const router = express.Router();
const movementController = require('../controllers/movementController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', movementController.getAll);

module.exports = router;

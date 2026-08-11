const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', invitationController.create);
router.get('/team', invitationController.getTeam);

module.exports = router;

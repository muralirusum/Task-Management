const express = require('express');
const router = express.Router();
const { getActivities } = require('../controllers/activityController');
const { authenticateUser } = require('../middlewares/auth');

router.use(authenticateUser);
router.get('/', getActivities);

module.exports = router;

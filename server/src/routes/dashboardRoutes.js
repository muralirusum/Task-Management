const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController');
const { authenticateUser } = require('../middlewares/auth');

router.use(authenticateUser);
router.get('/', getDashboardData);

module.exports = router;

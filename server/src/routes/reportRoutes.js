const express = require('express');
const router = express.Router();
const { getReports } = require('../controllers/reportController');
const { authenticateUser } = require('../middlewares/auth');

router.use(authenticateUser);
router.get('/', getReports);

module.exports = router;

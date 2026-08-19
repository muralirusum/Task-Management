const express = require('express');
const router = express.Router();
const {
  getActiveTimer,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  addManualTime,
  getTimeLogs,
  getSummaryData,
} = require('../controllers/timeTrackingController');
const { authenticateUser } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/summary', getSummaryData);

router.get('/active', getActiveTimer);
router.post('/start', startTimer);
router.post('/pause', pauseTimer);
router.post('/resume', resumeTimer);
router.post('/stop', stopTimer);
router.post('/manual', addManualTime);
router.get('/logs', getTimeLogs);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getLogs,
  clearLogs,
  deleteUserLogs,
  requestLeave,
  getLeaves,
  updateLeaveStatus
} = require('../controllers/attendanceController');
const { authenticateUser } = require('../middlewares/auth');

router.use(authenticateUser);

router.post('/log', markAttendance);
router.get('/logs', getLogs);
router.delete('/logs', clearLogs);
router.delete('/logs/user/:userId', deleteUserLogs);
router.post('/leave', requestLeave);
router.get('/leaves', getLeaves);
router.patch('/leave/:id', updateLeaveStatus);

module.exports = router;

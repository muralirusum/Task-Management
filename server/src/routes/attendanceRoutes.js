const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getLogs,
  requestLeave,
  getLeaves,
  updateLeaveStatus
} = require('../controllers/attendanceController');
const { authenticateUser } = require('../middlewares/auth');

router.use(authenticateUser);

router.post('/log', markAttendance);
router.get('/logs', getLogs);
router.post('/leave', requestLeave);
router.get('/leaves', getLeaves);
router.patch('/leave/:id', updateLeaveStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  loginUser,
  getMe,
  switchDemoUser,
  getDemoUsers,
  changePassword,
} = require('../controllers/authController');
const { authenticateUser } = require('../middlewares/auth');

router.post('/login', loginUser);
router.get('/me', authenticateUser, getMe);
router.post('/switch-demo', switchDemoUser);
router.get('/demo-users', getDemoUsers);
router.patch('/password', authenticateUser, changePassword);

module.exports = router;

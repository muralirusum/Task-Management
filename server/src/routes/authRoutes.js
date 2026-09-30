const express = require('express');
const router = express.Router();
const {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  changePassword,
  requestDeleteOtp,
  confirmDeleteAccount,
  deleteAccountWithPassword,
  testEmail,
} = require('../controllers/authController');
const { authenticateUser } = require('../middlewares/auth');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', loginUser);
router.post('/test-email', testEmail);
router.get('/me', authenticateUser, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);
router.post('/verify-email', verifyEmail);
router.patch('/password', authenticateUser, changePassword);
router.post('/request-delete-otp', authenticateUser, requestDeleteOtp);
router.delete('/delete-account', authenticateUser, confirmDeleteAccount);
router.delete('/delete-account-password', authenticateUser, deleteAccountWithPassword);

module.exports = router;

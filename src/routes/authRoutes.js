const express = require('express');
const router = express.Router();
const {
  login,
  register,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} = require('../controllers/authController');
const {
  registerValidation,
  loginValidation,
  emailValidation,
  resetPasswordValidation,
} = require('../middleware/validators');
const unauthenticatedRateLimiter = require('../middleware/rateLimiter');

router.use(unauthenticatedRateLimiter);

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', emailValidation, forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', emailValidation, resendVerification);

module.exports = router;

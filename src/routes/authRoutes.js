const express = require('express');
const router = express.Router();
const { getUser, login, register, forgotPassword, resetPassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation } = require('../middleware/validators');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, resetPassword);
router.get('/me', auth, getUser);

module.exports = router;

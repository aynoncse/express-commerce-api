const express = require('express');
const router = express.Router();
const { login, register, forgotPassword, resetPassword } = require('../controllers/authController');
const { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation } = require('../middleware/validators');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, resetPassword);

module.exports = router;

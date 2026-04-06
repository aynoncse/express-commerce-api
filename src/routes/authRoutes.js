const express = require('express');
const router = express.Router();
const { getUser, login, register } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validators');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', auth, getUser);

module.exports = router;

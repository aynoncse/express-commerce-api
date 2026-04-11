const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getMe, updateProfile, updatePassword, logout } = require('../controllers/userController');
const { updateProfileValidation, updatePasswordValidation } = require('../middleware/validators');

router.use(auth);

router.get('/me', getMe);
router.put('/profile', updateProfileValidation, updateProfile);
router.put('/password', updatePasswordValidation, updatePassword);
router.post('/logout', logout);

module.exports = router;

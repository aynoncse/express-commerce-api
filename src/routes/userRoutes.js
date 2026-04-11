const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { updateProfile, updatePassword } = require('../controllers/userController');
const { updateProfileValidation, updatePasswordValidation } = require('../middleware/validators');

router.use(auth);

router.put('/profile', updateProfileValidation, updateProfile);
router.put('/password', updatePasswordValidation, updatePassword);

module.exports = router;

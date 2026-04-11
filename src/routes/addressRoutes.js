const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  removeAddress,
} = require('../controllers/addressController');
const {
  addressValidation,
  addressUpdateValidation,
} = require('../middleware/validators');

router.use(auth);

router.get('/', getAddresses);
router.get('/:addressId', getAddressById);
router.post('/', addressValidation, createAddress);
router.put('/:addressId', addressUpdateValidation, updateAddress);
router.delete('/:addressId', removeAddress);

module.exports = router;

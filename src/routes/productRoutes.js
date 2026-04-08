// Write route handlers for product-related endpoints
const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const { productValidation, productUpdateValidation } = require('../middleware/validators');
const upload = require('../middleware/upload');
const {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductById,
} = require('../controllers/productController');

// Public Routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin Routes
router.post(
  '/',
  auth,
  isAdmin,
  upload.array('images', 5),
  productValidation,
  addProduct,
);

router.put(
  '/:id',
  auth,
  isAdmin,
  upload.array('images', 5),
  productUpdateValidation,
  updateProduct,
);
router.delete('/:id', auth, isAdmin, deleteProduct);

module.exports = router;

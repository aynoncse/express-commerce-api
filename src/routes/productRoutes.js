// Write route handlers for product-related endpoints
const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const { getProducts, addProduct, updateProduct, deleteProduct, getProductById } = require('../controllers/productController');
const { productValidation } = require('../middleware/validators');

// Public Routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin Routes
router.post('/', auth, isAdmin, productValidation, addProduct);
router.put('/:id', auth, isAdmin, productValidation, updateProduct);
router.delete('/:id', auth, isAdmin, deleteProduct);

module.exports = router;
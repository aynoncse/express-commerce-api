const { body } = require('express-validator');

const registerValidation = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const productValidation = [
  body('name').notEmpty().withMessage('Product name is required').trim(),
  body('description').optional().trim(),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('category').notEmpty().withMessage('Category is required').trim(),
];

const productUpdateValidation = [
  body('name').optional().notEmpty().withMessage('Product name cannot be empty').trim(),
  body('description').optional().trim(),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty').trim(),
];

module.exports = {
  registerValidation,
  loginValidation,
  productValidation,
  productUpdateValidation,
};
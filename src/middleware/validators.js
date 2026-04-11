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

const emailValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
];

const forgotPasswordValidation = emailValidation;

const resetPasswordValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

const updateProfileValidation = [
  body('name').notEmpty().withMessage('Name is required').trim(),
];

const updatePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
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

const addressValidation = [
  body('label').optional().trim().isLength({ max: 50 }).withMessage('Label must be 50 characters or fewer'),
  body('street').notEmpty().withMessage('Street address is required').trim(),
  body('city').notEmpty().withMessage('City is required').trim(),
  body('state').notEmpty().withMessage('State is required').trim(),
  body('postalCode').notEmpty().withMessage('Postal code is required').trim(),
  body('country').notEmpty().withMessage('Country is required').trim(),
  body('phone').optional().trim(),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
];

const addressUpdateValidation = [
  body('label').optional().trim().isLength({ max: 50 }).withMessage('Label must be 50 characters or fewer'),
  body('street').optional().notEmpty().withMessage('Street address cannot be empty').trim(),
  body('city').optional().notEmpty().withMessage('City cannot be empty').trim(),
  body('state').optional().notEmpty().withMessage('State cannot be empty').trim(),
  body('postalCode').optional().notEmpty().withMessage('Postal code cannot be empty').trim(),
  body('country').optional().notEmpty().withMessage('Country cannot be empty').trim(),
  body('phone').optional().trim(),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
];

module.exports = {
  registerValidation,
  loginValidation,
  emailValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updateProfileValidation,
  updatePasswordValidation,
  productValidation,
  productUpdateValidation,
  addressValidation,
  addressUpdateValidation,
};

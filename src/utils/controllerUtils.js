const { validationResult } = require('express-validator');

const validateRequest = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.status = 400;
    error.payload = { errors: errors.array() };
    throw error;
  }
};

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((error) => {
    if (error && error.status) {
      return res.status(error.status).json(error.payload ?? { message: error.message });
    }

    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  });

module.exports = { validateRequest, asyncHandler };

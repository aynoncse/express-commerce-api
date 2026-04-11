const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate a request using a JSON Web Token (JWT)
 * Verifies the token in the Authorization header and sets the req.user property
 * to the decoded user object if the token is valid.
 * Returns a 401 Unauthorized response if the token is invalid or missing.
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @param {Function} next Next middleware function
 */
const auth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized, invalid token' });
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: 'Unauthorized, invalid token' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ message: 'Unauthorized, invalid token' });
  }
};

/**
 * Middleware to verify if the request is from an admin user
 * Checks if the req.user object exists and if the user's role is 'admin'
 * If the user is an admin, calls the next middleware function
 * Otherwise, returns a 403 Forbidden response with the message 'Admin access required'
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @param {Function} next Next middleware function
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Admin access required' });
  }
};

module.exports = {
  auth,
  isAdmin,
};

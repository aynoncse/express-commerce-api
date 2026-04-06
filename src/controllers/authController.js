const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

/**
 * Register a new user
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @returns {Promise<Object>} JSON response containing the user's details and a token
 * @throws {Error} Error during registration
 */
const register = async (req, res) => {
  // check for validation errors
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'This email is already in use' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
    });

    const token = generateToken(user);

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Login an existing user
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @returns {Promise<Object>} JSON response containing the user's details and a token
 * @throws {Error} Error during login
 */
const login = async (req, res) => {
  // check for validation errors
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get the currently logged in user
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @returns {Promise<Object>} JSON response containing the user's details
 * @throws {Error} Error during user retrieval
 */
const getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Generates a JSON Web Token (JWT) for a given user.
 * The token contains the user's id, name, email, and role.
 * The token is signed with the JWT_SECRET environment variable.
 * The token expires after the time specified in the JWT_EXPIRE environment variable.
 * @param {Object} user User object containing id, name, email, and role.
 * @returns {string} JSON Web Token.
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE },
  );
};

module.exports = {
  getUser,
  login,
  register,
};

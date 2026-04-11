const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { generateToken } = require('../utils/jwt');

const getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
};

const updateProfile = async (userId, { name }) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.name = name;
  await user.save();

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user),
  };
};

const updatePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user),
  };
};

const logout = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.tokenVersion += 1;
  await user.save();

  return { message: 'Logged out successfully' };
};

module.exports = {
  getProfile,
  updateProfile,
  updatePassword,
  logout,
};

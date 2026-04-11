const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const ApiError = require('../utils/apiError');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../utils/email');
const { generateToken } = require('../utils/jwt');

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const buildVerificationUrl = (baseUrl, token) =>
  `${baseUrl}/api/auth/verify-email/${token}`;

const register = async ({ name, email, password }, baseUrl) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError(400, 'This email is already in use');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedVerificationToken = hashToken(verificationToken);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'user',
    emailVerified: false,
    verificationToken: hashedVerificationToken,
    verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  await sendVerificationEmail(user.email, buildVerificationUrl(baseUrl, verificationToken));

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: false,
    message: 'Registration successful. Please verify your email before logging in.',
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  if (!user.emailVerified) {
    throw new ApiError(401, 'Email not verified. Please verify your email before logging in.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user),
  };
};

const forgotPassword = async (email, baseUrl) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(resetToken);

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
  await sendPasswordResetEmail(user.email, resetUrl);

  return { message: 'Password reset email sent' };
};

const resetPassword = async (token, password) => {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        [Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired token');
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return { message: 'Password reset successful' };
};

const verifyEmail = async (token) => {
  const hashedToken = hashToken(token);
  const user = await User.findOne({
    where: {
      verificationToken: hashedToken,
      verificationTokenExpires: {
        [Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  user.emailVerified = true;
  user.verificationToken = null;
  user.verificationTokenExpires = null;
  await user.save();

  return { message: 'Email verified successfully' };
};

const resendVerification = async (email, baseUrl) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.emailVerified) {
    throw new ApiError(400, 'Email is already verified');
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(verificationToken);

  user.verificationToken = hashedToken;
  user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  await sendVerificationEmail(user.email, buildVerificationUrl(baseUrl, verificationToken));

  return { message: 'Verification email resent successfully' };
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};

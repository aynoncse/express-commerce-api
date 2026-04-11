const { validateRequest, asyncHandler } = require('../utils/controllerUtils');
const authService = require('../services/authService');

const extractBaseUrl = (req) =>
  process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;

const register = asyncHandler(async (req, res) => {
  validateRequest(req);

  const result = await authService.register(req.body, extractBaseUrl(req));
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  validateRequest(req);

  const result = await authService.login(req.body);
  res.json(result);
});

const forgotPassword = asyncHandler(async (req, res) => {
  validateRequest(req);

  const result = await authService.forgotPassword(req.body.email, extractBaseUrl(req));
  res.json(result);
});

const resetPassword = asyncHandler(async (req, res) => {
  validateRequest(req);

  const result = await authService.resetPassword(req.params.token, req.body.password);
  res.json(result);
});

const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.params.token);
  res.json(result);
});

const resendVerification = asyncHandler(async (req, res) => {
  validateRequest(req);

  const result = await authService.resendVerification(req.body.email, extractBaseUrl(req));
  res.json(result);
});

module.exports = {
  login,
  register,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};

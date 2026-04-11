const { validateRequest, asyncHandler } = require('../utils/controllerUtils');
const userService = require('../services/userService');

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  res.json(user);
});

const updateProfile = asyncHandler(async (req, res) => {
  validateRequest(req);

  const result = await userService.updateProfile(req.user.id, req.body);
  res.json(result);
});

const updatePassword = asyncHandler(async (req, res) => {
  validateRequest(req);

  const result = await userService.updatePassword(
    req.user.id,
    req.body.currentPassword,
    req.body.newPassword,
  );
  res.json(result);
});

const logout = asyncHandler(async (req, res) => {
  const result = await userService.logout(req.user.id);
  res.json(result);
});

module.exports = {
  getMe,
  updateProfile,
  updatePassword,
  logout,
};

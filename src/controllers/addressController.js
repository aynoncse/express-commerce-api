const { validateRequest, asyncHandler } = require('../utils/controllerUtils');
const addressService = require('../services/addressService');

const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressService.getAddresses(req.user.id);
  res.json({ addresses });
});

const getAddressById = asyncHandler(async (req, res) => {
  const address = await addressService.getAddressById(req.user.id, parseInt(req.params.addressId, 10));
  res.json(address);
});

const createAddress = asyncHandler(async (req, res) => {
  validateRequest(req);

  const address = await addressService.createAddress(req.user.id, req.body);
  res.status(201).json(address);
});

const updateAddress = asyncHandler(async (req, res) => {
  validateRequest(req);

  const address = await addressService.updateAddress(
    req.user.id,
    parseInt(req.params.addressId, 10),
    req.body,
  );
  res.json(address);
});

const removeAddress = asyncHandler(async (req, res) => {
  await addressService.removeAddress(req.user.id, parseInt(req.params.addressId, 10));
  res.status(204).send();
});

module.exports = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  removeAddress,
};

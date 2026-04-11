const Address = require('../models/Address');
const ApiError = require('../utils/apiError');

const setDefaultAddress = async (userId, transaction = null) => {
  await Address.update(
    { isDefault: false },
    { where: { userId, isDefault: true }, transaction },
  );
};

const getAddresses = async (userId) => {
  return Address.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
  });
};

const getAddressById = async (userId, addressId) => {
  const address = await Address.findOne({
    where: { id: addressId, userId },
  });

  if (!address) {
    throw new ApiError(404, 'Address not found');
  }

  return address;
};

const createAddress = async (userId, addressData) => {
  if (addressData.isDefault) {
    await setDefaultAddress(userId);
  }

  return Address.create({
    userId,
    ...addressData,
  });
};

const updateAddress = async (userId, addressId, addressData) => {
  const address = await getAddressById(userId, addressId);

  if (addressData.isDefault === true) {
    await setDefaultAddress(userId);
    address.isDefault = true;
  }

  Object.entries(addressData).forEach(([key, value]) => {
    if (value !== undefined && key !== 'isDefault') {
      address[key] = value;
    }
  });

  await address.save();
  return address;
};

const removeAddress = async (userId, addressId) => {
  const address = await getAddressById(userId, addressId);
  await address.destroy();
};

module.exports = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  removeAddress,
};

const Address = require('../models/Address');
const { validationResult } = require('express-validator');

const setDefaultAddress = async (userId, transaction = null) => {
  await Address.update(
    { isDefault: false },
    { where: { userId, isDefault: true }, transaction },
  );
};

const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    res.json({ addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAddressById = async (req, res) => {
  try {
    const addressId = parseInt(req.params.addressId, 10);
    if (Number.isNaN(addressId) || addressId < 1) {
      return res.status(400).json({ message: 'Invalid address ID' });
    }

    const address = await Address.findOne({
      where: { id: addressId, userId: req.user.id },
    });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.json(address);
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createAddress = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      label,
      street,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault = false,
    } = req.body;

    if (isDefault) {
      await setDefaultAddress(req.user.id);
    }

    const address = await Address.create({
      userId: req.user.id,
      label,
      street,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault,
    });

    res.status(201).json(address);
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateAddress = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const addressId = parseInt(req.params.addressId, 10);
    if (Number.isNaN(addressId) || addressId < 1) {
      return res.status(400).json({ message: 'Invalid address ID' });
    }

    const address = await Address.findOne({
      where: { id: addressId, userId: req.user.id },
    });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const {
      label,
      street,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault,
    } = req.body;

    if (isDefault === true) {
      await setDefaultAddress(req.user.id);
      address.isDefault = true;
    }

    if (label !== undefined) address.label = label;
    if (street !== undefined) address.street = street;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (postalCode !== undefined) address.postalCode = postalCode;
    if (country !== undefined) address.country = country;
    if (phone !== undefined) address.phone = phone;

    await address.save();

    res.json(address);
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const removeAddress = async (req, res) => {
  try {
    const addressId = parseInt(req.params.addressId, 10);
    if (Number.isNaN(addressId) || addressId < 1) {
      return res.status(400).json({ message: 'Invalid address ID' });
    }

    const address = await Address.findOne({
      where: { id: addressId, userId: req.user.id },
    });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await address.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  removeAddress,
};

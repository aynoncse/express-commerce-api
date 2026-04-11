const { asyncHandler } = require('../utils/controllerUtils');
const cartService = require('../services/cartService');

const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  res.json(cart);
});

const addToCart = asyncHandler(async (req, res) => {
  const cartItem = await cartService.addToCart(
    req.user.id,
    req.body.productId,
    parseInt(req.body?.quantity, 10) || 1,
  );
  res.status(201).json(cartItem);
});

const updateCartItem = asyncHandler(async (req, res) => {
  const cartItem = await cartService.updateCartItem(
    req.user.id,
    req.params.itemId,
    parseInt(req.body?.quantity, 10),
  );
  res.json(cartItem);
});

const removeCartItem = asyncHandler(async (req, res) => {
  await cartService.removeCartItem(req.user.id, req.params.itemId);
  res.status(204).send();
});

module.exports = { addToCart, getCart, updateCartItem, removeCartItem };
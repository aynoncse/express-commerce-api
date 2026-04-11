const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ where: { userId } });
  if (!cart) {
    cart = await Cart.create({ userId });
  }
  return cart;
};

const getCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  const items = await CartItem.findAll({
    where: { cartId: cart.id },
    include: [{ model: Product, attributes: ['id', 'name', 'price', 'images'] }],
  });
  const total = items.reduce((sum, item) => sum + item.quantity * item.Product.price, 0);
  return { cart, items, total };
};

const addToCart = async (userId, productId, quantity) => {
  if (!productId) {
    throw new ApiError(400, 'Product ID is required');
  }

  if (Number.isNaN(quantity) || quantity < 1) {
    throw new ApiError(400, 'Quantity must be at least 1');
  }

  const product = await Product.findByPk(productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (product.stock < quantity) {
    throw new ApiError(400, 'Insufficient stock');
  }

  const cart = await getOrCreateCart(userId);
  let cartItem = await CartItem.findOne({
    where: { cartId: cart.id, productId },
  });

  if (cartItem) {
    cartItem.quantity += quantity;
    await cartItem.save();
  } else {
    cartItem = await CartItem.create({
      cartId: cart.id,
      productId,
      quantity,
    });
  }

  return cartItem;
};

const updateCartItem = async (userId, itemId, quantity) => {
  if (Number.isNaN(quantity) || quantity < 1) {
    throw new ApiError(400, 'Quantity must be at least 1');
  }

  const cartItem = await CartItem.findByPk(itemId);
  if (!cartItem) {
    throw new ApiError(404, 'Cart item not found');
  }

  const cart = await Cart.findByPk(cartItem.cartId);
  if (cart.userId !== userId) {
    throw new ApiError(403, 'Unauthorized');
  }

  const product = await Product.findByPk(cartItem.productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (product.stock < quantity) {
    throw new ApiError(400, 'Insufficient stock');
  }

  cartItem.quantity = quantity;
  await cartItem.save();
  return cartItem;
};

const removeCartItem = async (userId, itemId) => {
  const cartItem = await CartItem.findByPk(itemId);
  if (!cartItem) {
    throw new ApiError(404, 'Cart item not found');
  }

  const cart = await Cart.findByPk(cartItem.cartId);
  if (cart.userId !== userId) {
    throw new ApiError(403, 'Unauthorized');
  }

  await cartItem.destroy();
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
};

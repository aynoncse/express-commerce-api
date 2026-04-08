const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');

/**
 * Retrieves a cart for a given user ID, or creates a new one if it doesn't exist
 * @param {number} userId The ID of the user to retrieve the cart for
 * @returns {Promise<Object>} The cart object
 */
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ where: { userId } });

  if (!cart) {
    cart = await Cart.create({ userId });
  }

  return cart;
};

/**
 * Retrieves the cart for the current user
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @returns {Promise<Object>} JSON response containing the user's cart, items, and total
 * @throws {Error} Error fetching cart
 */
const getCart = async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.user.id);
        const items = await CartItem.findAll({
          where: { cartId: cart.id },
          include: [
            { model: Product, attributes: ['id', 'name', 'price', 'images'] },
          ],
        });
        const total = items.reduce((sum, item) => sum + item.quantity * item.Product.price, 0);
        res.json({ cart, items, total });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Adds a product to the user's cart
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @returns {Promise<Object>} JSON response containing the added cart item
 * @throws {Error} Error adding to cart
 */
const addToCart = async (req, res) => {
    console.log(req.body);
    
  const { productId, quantity = 1 } = req.body || {};

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  if (quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be at least 1' });
  }

  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const cart = await getOrCreateCart(req.user.id);
    let cartItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId,
      },
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
    res.status(201).json(cartItem);
  } catch (error) {
    console.error('Error adding to cart:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Updates a cart item's quantity
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @returns {Promise<Object>} JSON response containing the updated cart item
 * @throws {Error} Error updating cart item
 */
const updateCartItem = async(req, res) => {
    const {quantity} = req.body || {};

    if (!quantity || quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    try {
        const cartItem = await CartItem.findByPk(req.params.itemId);
        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        const cart = await Cart.findByPk(cartItem.cartId);
        if (cart.userId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const product = await Product.findByPk(cartItem.productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        cartItem.quantity = quantity;
        await cartItem.save();
        res.json(cartItem);
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Removes a cart item by ID
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @returns {Promise<Object>} JSON response containing the removed cart item
 * @throws {Error} Error removing cart item
 */
const removeCartItem = async (req, res) => {
    try {
        const cartItem = await CartItem.findByPk(req.params.itemId);
        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        const cart = await Cart.findByPk(cartItem.cartId);
        if (cart.userId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await cartItem.destroy();
        res.status(204).send();
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { addToCart, getCart, updateCartItem, removeCartItem };
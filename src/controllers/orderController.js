const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');

/**
 * Retrieves the cart for the given user ID, along with its items and their associated products.
 * If the cart does not exist, returns an object with cart set to null and items set to an empty array.
 * @param {number} userId The ID of the user to retrieve the cart for
 * @returns {Promise<Object>} An object containing the cart and its items
 */
const getCartWithItems = async (userId) => {
  const cart = await Cart.findOne({ where: { userId } });
  if (!cart) {
    return { cart: null, items: [] };
  }

  const items = await CartItem.findAll({
    where: { cartId: cart.id },
    include: [{ model: Product }],
  });

  return { cart, items };
};

/**
 * Creates a new order for the given user
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @returns {Promise<Object>} JSON response containing the created order
 * @throws {Error} Error creating order
 */
const createOrder = async (req, res) => {
  const { shippingAddress, paymentMethod = 'cash_on_delivery' } =
    req.body || {};
  if (!shippingAddress) {
    return res.status(400).json({ message: 'Shipping address is required' });
  }

  try {
    const { cart, items } = await getCartWithItems(req.user.id);
    if (!cart || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate total amount and prepare order items
    let total = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = item.Product;

      if (product.stock < item.quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for product: ${product.name}` });
      }

      const itemTotal = item.quantity * product.price;
      total += itemTotal;

      orderItemsData.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images ? product.images[0] : null,
      });
    }

    // Create the order
    const order = await Order.create({
      userId: req.user.id,
      totalAmount: total,
      status: 'pending',
      shippingAddress,
      paymentMethod,
    });

    // Create order items
    for (const orderItem of orderItemsData) {
      await OrderItem.create({
        orderId: order.id,
        ...orderItem,
      });
    }

    // Reduce product stock
    for (const item of items) {
      const product = item.Product;
      product.stock -= item.quantity;
      await product.save();
    }

    // Clear the cart
    await CartItem.destroy({ where: { cartId: cart.id } });

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        items: orderItemsData,
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Retrieves all orders for the currently logged in user, along with their items.
 * Orders are returned in descending order of creation date.
 * @returns {Promise<Object>} JSON response containing the user's orders
 * @throws {Error} Error during order retrieval
 */
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [{ model: OrderItem }],
    });
    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Retrieves an order by ID for the currently logged in user, along with its items.
 * If the order does not exist, returns a 404 error.
 * @returns {Promise<Object>} JSON response containing the order details
 * @throws {Error} Error during order retrieval
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.orderId, userId: req.user.id },
      include: [{ model: OrderItem }],
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Cancels an order by ID for the currently logged in user.
 * If the order does not exist, returns a 404 error.
 * If the order is not in the 'pending' status, returns a 400 error.
 * Restores the product stock of the items in the order.
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @returns {Promise<Object>} JSON response containing the cancelled order details
 * @throws {Error} Error during order cancellation
 */
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.orderId, userId: req.user.id },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order cannot be cancelled' });
    }

    // Restore product stock
    const items = await OrderItem.findAll({ where: { orderId: order.id } });
    for (const item of items) {
        const product = await Product.findByPk(item.productId);
        if (product) {
            product.stock += item.quantity;
            await product.save();
        }
    }

    order.status = 'cancelled';
    await order.save();
    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Error canceling order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { createOrder, getMyOrders, getOrderById, cancelOrder };

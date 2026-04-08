const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

const createOrder = async (req, res) => {
  const { shippingAddress, paymentMethod = 'stripe' } = req.body || {};

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

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'usd',
      metadata: { orderId: order.id, userId: req.user.id },
    });

    // Save paymentIntentId
    order.paymentIntentId = paymentIntent.id;
    await order.save();

    res.status(201).json({
      orderId: order.id,
      clientSecret: paymentIntent.client_secret,
      totalAmount: total,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const confirmOrder = async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);

    const order = await Order.findOne({
      where: { id: orderId, userId: req.user.id },
    });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: `Order already ${order.status}` });
    }

    // Verify payment with Stripe
    if(!order.paymentIntentId) {
      return res.status(400).json({ message: 'No payment intent associated with this order' });
    }
    
    const paymentIntent = await stripe.paymentIntents.retrieve(
      order.paymentIntentId,
    );

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Update order status
    order.status = 'paid';
    await order.save();
    
    // Reduce stock and clear cart
    const cart = await Cart.findOne({ where: { userId: req.user.id } });

    if(cart) {
        const items = await CartItem.findAll({ where: { cartId: cart.id } });
        for (const item of items) {
          const product = await Product.findByPk(item.productId);
          if (product) {
            product.stock -= item.quantity;
            await product.save();
          }
        }
        await CartItem.destroy({ where: { cartId: cart.id } });
    }
    res.json({ message: 'Order confirmed successfully', order });
  } catch (error) {
    console.error('Error confirming order:', error);
    return res.status(500).json({ message: 'Internal server error' });
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

module.exports = { createOrder, getMyOrders, getOrderById, cancelOrder, confirmOrder };

const sequelize = require('../config/database');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const { sendConfirmationEmail } = require('../utils/email');
const ApiError = require('../utils/apiError');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

const createOrder = async (userId, orderData) => {
  const { shippingAddress, paymentMethod = 'stripe' } = orderData;
  if (!shippingAddress) {
    throw new ApiError(400, 'Shipping address is required');
  }

  const { cart, items } = await getCartWithItems(userId);
  if (!cart || items.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }

  // Create the Stripe PaymentIntent BEFORE touching the database,
  // so a Stripe failure never leaves stock decremented with no order.
  let total = 0;
  const orderItemsData = [];

  for (const item of items) {
    const product = item.Product;
    if (product.stock < item.quantity) {
      throw new ApiError(400, `Insufficient stock for product: ${product.name}`);
    }
    total += item.quantity * product.price;
    orderItemsData.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      image: product.images ? product.images[0] : null,
    });
  }

  // Create Stripe PaymentIntent first — if this fails, nothing in DB is touched
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(total * 100),
    currency: 'usd',
    // orderId added after order creation below via update
  });

  const transaction = await sequelize.transaction();
  try {
    const order = await Order.create(
      {
        userId,
        totalAmount: total,
        status: 'pending',
        shippingAddress,
        paymentMethod,
        paymentIntentId: paymentIntent.id,
      },
      { transaction },
    );

    for (const orderItem of orderItemsData) {
      await OrderItem.create({ orderId: order.id, ...orderItem }, { transaction });
    }

    for (const item of items) {
      const product = item.Product;
      product.stock -= item.quantity;
      await product.save({ transaction });
    }

    await CartItem.destroy({ where: { cartId: cart.id }, transaction });

    await transaction.commit();

    // Update the PaymentIntent metadata with the real orderId now that we have it
    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: { orderId: order.id, userId },
    });

    return {
      orderId: order.id,
      clientSecret: paymentIntent.client_secret,
      totalAmount: total,
    };
  } catch (error) {
    await transaction.rollback();

    // Cancel the PaymentIntent so it doesn't remain open on Stripe
    try {
      await stripe.paymentIntents.cancel(paymentIntent.id);
    } catch (stripeErr) {
      console.error('Failed to cancel PaymentIntent after DB rollback:', stripeErr.message);
    }

    if (error instanceof ApiError) throw error;
    throw new ApiError(500, 'Error creating order');
  }
};

const getOrderByUser = async (userId, orderId) => {
  const order = await Order.findOne({
    where: { id: orderId, userId },
    include: [{ model: OrderItem }],
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  return order;
};

const getMyOrders = async (userId) => {
  return Order.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    include: [{ model: OrderItem }],
  });
};

const cancelOrder = async (userId, orderId) => {
  const order = await getOrderByUser(userId, orderId);
  if (order.status !== 'pending') {
    throw new ApiError(400, 'Only pending orders can be cancelled');
  }

  const items = await OrderItem.findAll({ where: { orderId: order.id } });
  for (const item of items) {
    const product = await Product.findByPk(item.productId);
    if (product) {
      product.stock += item.quantity;
      await product.save();
    }
  }

  // Cancel the PaymentIntent on Stripe so the customer isn't charged
  if (order.paymentIntentId) {
    try {
      await stripe.paymentIntents.cancel(order.paymentIntentId);
    } catch (err) {
      console.error('Failed to cancel PaymentIntent on Stripe:', err.message);
    }
  }

  order.status = 'cancelled';
  await order.save();
  return { message: 'Order cancelled successfully', order };
};

/**
 * Called ONLY from the Stripe webhook after payment_intent.succeeded.
 * Never exposed as a user-facing HTTP endpoint.
 */
const confirmOrderByWebhook = async (order, paymentIntent, userEmail) => {
  order.status = 'paid';
  order.paymentInfo = {
    id: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    payment_method: paymentIntent.payment_method,
  };
  await order.save();

  if (userEmail) {
    await sendConfirmationEmail(order, userEmail);
  }
};

/**
 * Called ONLY from the Stripe webhook after payment_intent.payment_failed.
 * Never exposed as a user-facing HTTP endpoint.
 */
const failOrderByWebhook = async (order) => {
  const items = await OrderItem.findAll({ where: { orderId: order.id } });
  for (const item of items) {
    const product = await Product.findByPk(item.productId);
    if (product) {
      product.stock += item.quantity;
      await product.save();
    }
  }
  order.status = 'failed';
  await order.save();
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById: getOrderByUser,
  cancelOrder,
  confirmOrderByWebhook,
  failOrderByWebhook,
};

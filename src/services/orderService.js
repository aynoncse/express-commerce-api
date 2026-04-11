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

  const transaction = await sequelize.transaction();
  try {
    let total = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = item.Product;
      if (product.stock < item.quantity) {
        await transaction.rollback();
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

    const order = await Order.create(
      {
        userId,
        totalAmount: total,
        status: 'pending',
        shippingAddress,
        paymentMethod,
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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      metadata: { orderId: order.id, userId },
    });

    order.paymentIntentId = paymentIntent.id;
    await order.save({ transaction });

    await transaction.commit();

    return {
      orderId: order.id,
      clientSecret: paymentIntent.client_secret,
      totalAmount: total,
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) {
      throw error;
    }
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

const confirmOrder = async (userId, orderId, userEmail) => {
  const order = await getOrderByUser(userId, orderId);
  if (order.status !== 'pending') {
    throw new ApiError(400, `Order already ${order.status}`);
  }

  if (!order.paymentIntentId) {
    throw new ApiError(400, 'No payment intent associated with this order');
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId);
  if (paymentIntent.status !== 'succeeded') {
    throw new ApiError(400, 'Payment not completed');
  }

  order.status = 'paid';
  order.paymentInfo = {
    id: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    payment_method: paymentIntent.payment_method,
  };
  await order.save();
  await sendConfirmationEmail(order, userEmail);

  return { message: 'Order confirmed successfully', order };
};

const cancelOrder = async (userId, orderId) => {
  const order = await getOrderByUser(userId, orderId);
  if (order.status !== 'pending') {
    throw new ApiError(400, 'Order cannot be cancelled');
  }

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
  return { message: 'Order cancelled successfully', order };
};

const failOrder = async (userId, orderId) => {
  const order = await getOrderByUser(userId, orderId);
  if (order.status !== 'pending') {
    throw new ApiError(400, `Order already ${order.status}`);
  }

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
  return { message: 'Order marked as failed', order };
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById: getOrderByUser,
  confirmOrder,
  cancelOrder,
  failOrder,
};

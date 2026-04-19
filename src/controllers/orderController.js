const { validateRequest, asyncHandler } = require('../utils/controllerUtils');
const orderService = require('../services/orderService');

const createOrder = asyncHandler(async (req, res) => {
  validateRequest(req);

  const result = await orderService.createOrder(req.user.id, req.body);
  res.status(201).json(result);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getMyOrders(req.user.id);
  res.json({ orders });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.user.id, req.params.orderId);
  res.json(order);
});

const cancelOrder = asyncHandler(async (req, res) => {
  const result = await orderService.cancelOrder(req.user.id, req.params.orderId);
  res.json(result);
});

// confirmOrder and failOrder have been removed.
// Payment confirmation and failure are now handled automatically
// by the Stripe webhook at POST /api/webhook/stripe.

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};

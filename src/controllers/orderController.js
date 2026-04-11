const { validateRequest, asyncHandler } = require('../utils/controllerUtils');
const orderService = require('../services/orderService');

const createOrder = asyncHandler(async (req, res) => {
  validateRequest(req);

  const result = await orderService.createOrder(req.user.id, req.body);
  res.status(201).json(result);
});

const confirmOrder = asyncHandler(async (req, res) => {
  const result = await orderService.confirmOrder(req.user.id, req.params.orderId, req.user.email);
  res.json(result);
});

const failOrder = asyncHandler(async (req, res) => {
  const result = await orderService.failOrder(req.user.id, req.params.orderId);
  res.json(result);
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

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  confirmOrder,
  failOrder,
};
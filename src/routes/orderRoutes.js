const express = require('express');
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} = require('../controllers/orderController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:orderId', getOrderById);
router.put('/:orderId/cancel', cancelOrder);

// /confirm and /fail endpoints removed.
// Order status is now updated automatically via the Stripe webhook.

module.exports = router;

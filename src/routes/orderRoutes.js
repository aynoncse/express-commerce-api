const express = require('express');
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  confirmOrder,
  failOrder,
} = require('../controllers/orderController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:orderId', getOrderById);
router.put('/:orderId/cancel', cancelOrder);
router.put('/:orderId/fail', failOrder);
router.post('/:orderId/confirm', confirmOrder);

module.exports = router;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const orderService = require('../services/orderService');
const Order = require('../models/Order');
const User = require('../models/User');

/**
 * Stripe sends a signed POST to /api/webhook/stripe after every payment event.
 * We verify the signature using STRIPE_WEBHOOK_SECRET so we know the request
 * genuinely came from Stripe and hasn't been tampered with.
 */
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ message: 'Missing stripe-signature header' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,                          // raw Buffer — must NOT be JSON-parsed
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.orderId;

        if (!orderId) {
          console.warn('payment_intent.succeeded: no orderId in metadata');
          break;
        }

        const order = await Order.findByPk(orderId);
        if (!order) {
          console.warn(`payment_intent.succeeded: order ${orderId} not found`);
          break;
        }

        if (order.status !== 'pending') break; // already processed, idempotent

        const user = await User.findByPk(order.userId);
        await orderService.confirmOrderByWebhook(order, paymentIntent, user?.email);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.orderId;

        if (!orderId) break;

        const order = await Order.findByPk(orderId);
        if (!order || order.status !== 'pending') break;

        await orderService.failOrderByWebhook(order);
        break;
      }

      default:
        // Stripe sends many event types — safely ignore unhandled ones
        break;
    }
  } catch (err) {
    console.error(`Error handling webhook event ${event.type}:`, err);
    // Return 500 so Stripe retries delivery
    return res.status(500).json({ message: 'Webhook handler error' });
  }

  // Always acknowledge immediately so Stripe doesn't retry
  res.json({ received: true });
};

module.exports = { handleStripeWebhook };

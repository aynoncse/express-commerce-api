const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Stripe requires the raw unparsed body to validate the webhook signature.
// express.raw() must be used here — NOT express.json().
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  webhookController.handleStripeWebhook,
);

module.exports = router;

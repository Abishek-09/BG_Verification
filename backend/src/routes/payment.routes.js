// =====================================================================
// Background Verification System - Razorpay Payment Routes
// =====================================================================

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Create Razorpay Order
router.post('/create-order', paymentController.createOrder);

// Verify Razorpay Payment Signature
router.post('/verify-payment', paymentController.verifyPayment);

module.exports = router;

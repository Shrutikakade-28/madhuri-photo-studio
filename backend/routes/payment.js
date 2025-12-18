const express = require("express");
const Razorpay = require("razorpay");
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a new order
router.post("/order", async (req, res) => {
  const { amount, currency } = req.body; // amount expected in paise here

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('Razorpay keys missing in /api/payment/order');
    return res.status(500).json({ error: 'Razorpay keys not configured on server' });
  }

  if (!amount || isNaN(amount)) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`,
    });
    res.json(order);
  } catch (err) {
    console.error("Razorpay order creation failed:", err && err.error ? err.error : err);
    const detail = (err && err.error && err.error.description) ? err.error.description : (err && err.message) ? err.message : 'Unknown error';
    res.status(500).json({ error: "Razorpay order creation failed", detail });
  }
});

module.exports = router;

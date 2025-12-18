const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const Razorpay = require('razorpay');
require('dotenv').config();
const mysql = require('mysql');
const paymentRoutes = require("./routes/payment");
// ROUTES
const adminRoutes = require("./routes/admin");
const authRoutes = require('./routes/auth');  // <-- existing auth routes
// MIDDLEWARES
app.use(cors({ origin: "*"}));
app.use(express.json());
app.use("/api/admin", adminRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/payment", paymentRoutes);

// MySQL connection (for bookings)
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Shruti28',
  database: process.env.DB_NAME || 'photo_studio',
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL connected");

  // create bookings table if not exists
  const createTableQuery = `CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    eventType VARCHAR(255),
    amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    paymentId VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;
  db.query(createTableQuery, (err) => {
    if (err) throw err;
    console.log("Bookings table ready");
  });
});

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// CREATE ORDER
app.post("/api/create-order", async (req, res) => {
  const { name, email, phone, eventType, amount } = req.body;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('Razorpay keys missing. RAZORPAY_KEY_ID present:', !!process.env.RAZORPAY_KEY_ID);
    return res.status(500).json({ success: false, error: 'Razorpay keys not configured on server' });
  }

  if (!amount || isNaN(amount)) {
    return res.status(400).json({ success: false, error: 'Invalid amount' });
  }

  const options = {
    amount: Math.round(amount * 100), // convert INR to paise
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
    payment_capture: 1
  };

  try {
    const order = await razorpay.orders.create(options);

    // Save booking in DB
    const sql = `INSERT INTO bookings (name, email, phone, eventType, amount, paymentId) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(sql, [name, email, phone, eventType, amount, order.id], (err, result) => {
      if (err) {
        console.error('DB insert error (create-order):', err);
        return res.status(500).json({ success: false, error: 'Database error saving booking' });
      }
      // include key id so frontend doesn't rely on client env vars
      res.json({ success: true, order, bookingId: result.insertId, key: process.env.RAZORPAY_KEY_ID });
    });
  } catch (err) {
    // Log detailed Razorpay error if present
    console.error('Razorpay order creation failed:', err && err.error ? err.error : err);
    const detail = (err && err.error && err.error.description) ? err.error.description : (err && err.message) ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: 'Razorpay order creation failed', detail });
  }
});

// PAYMENT SUCCESS
app.post("/api/payment-success", (req, res) => {
  const { bookingId, paymentId } = req.body;
  const sql = `UPDATE bookings SET status='completed', paymentId=? WHERE id=?`;
  db.query(sql, [paymentId, bookingId], (err) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Payment successful and booking confirmed!" });
  });
});

// GET BOOKINGS (for admin dashboard)
app.get("/api/bookings", (req, res) => {
  const sql = `SELECT * FROM bookings ORDER BY created_at DESC`;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ bookings: result });
  });
});

// CONTACT API (temporary)
app.post('/api/contact', (req, res) => {
  console.log('Contact form submission:', req.body);
  res.json({ success: true, message: 'Message received' });
});

// RAZORPAY KEYS INFO (debug)
app.get('/api/razorpay-keys', (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID || null;
  res.json({
    keyPresent: !!keyId,
    keyMasked: keyId ? keyId.replace(/.(?=.{4})/g, '*') : null
  });
});

// TEST ROUTE
app.get('/', (req, res) => {
  res.send({ status: 'Server is up' });
});

// START SERVER
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

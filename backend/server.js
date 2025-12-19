const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const Razorpay = require('razorpay');
require('dotenv').config();
// const mysql = require('mysql');
const db = require('./db');
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
 
// Ensure DB tables exist and align with app expectations
const ensureSchema = () => {
  const createUsers = `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
  )`;

  const createAdmin = `CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
  )`;

  const createBookings = `CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    event_type VARCHAR(100),
    full_name VARCHAR(100),
    email VARCHAR(120),
    phone VARCHAR(20),
    location VARCHAR(255),
    amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    payment_id VARCHAR(255),
    payment_status VARCHAR(20) DEFAULT 'pending',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    booking_time VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`;

  db.query(createUsers, (err) => {
    if (err) return console.error('DB init (users) failed:', err.message);
    console.log('DB: users table ensured');
  });

  db.query(createAdmin, (err) => {
    if (err) return console.error('DB init (admin) failed:', err.message);
    console.log('DB: admin table ensured');
  });

  db.query(createBookings, (err) => {
    if (err) return console.error('DB init (bookings) failed:', err.message);
    console.log('DB: bookings table ensured');
  });
};

ensureSchema();

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// CREATE ORDER
app.post("/api/create-order", async (req, res) => {
  const { name, email, phone, eventType, amount, location, booking_time } = req.body;

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

    // Save booking in DB (use snake_case column names that match schema)
    const sql = `INSERT INTO bookings (full_name, email, phone, event_type, amount, payment_id, location, booking_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [name, email, phone, eventType, amount, order.id, location || null, booking_time || null], (err, result) => {
      if (err) {
        console.error('DB insert error (create-order):', err.message);
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
  // update both status and payment_id/payment_status fields
  const sql = `UPDATE bookings SET status='completed', payment_id=?, payment_status='paid' WHERE id=?`;
  db.query(sql, [paymentId, bookingId], (err) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Payment successful and booking confirmed!" });
  });
});

// GET BOOKINGS (for admin dashboard)
app.get("/api/bookings", (req, res) => {
  const sql = `SELECT * FROM bookings ORDER BY booking_date DESC`;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    // ensure response includes the fields frontend expects (payment_status, full_name, event_type)
    const bookings = (result || []).map((r) => ({
      id: r.id,
      full_name: r.full_name || r.name || null,
      event_type: r.event_type || r.eventType || null,
      location: r.location || null,
      booking_date: r.booking_date || r.created_at || null,
      booking_time: r.booking_time || null,
      status: r.status || 'pending',
      payment_status: r.payment_status || (r.status === 'completed' ? 'paid' : 'pending'),
      payment_id: r.payment_id || r.paymentId || null,
      amount: r.amount || 0
    }));
    res.json({ bookings });
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

// HEALTH CHECK (verifies DB connectivity)
app.get('/api/health', (req, res) => {
  db.query('SELECT 1 + 1 AS result', (err) => {
    if (err) {
      console.error('DB health check failed:', err.message);
      return res.status(500).json({ success: false, db: false, error: err.message });
    }
    res.json({ success: true, db: true });
  });
});

// Graceful error handlers for unhandled rejections & exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // exit to avoid undefined state (pm2 or hosting platform should restart)
  process.exit(1);
});

// START SERVER
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

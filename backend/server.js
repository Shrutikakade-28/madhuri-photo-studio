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

  const createMessages = `CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120),
    email VARCHAR(120),
    message TEXT,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

  db.query(createMessages, (err) => {
    if (err) return console.error('DB init (messages) failed:', err.message);
    console.log('DB: messages table ensured');
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
    // allow optional user_id if provided
    let userIdValue = req.body.userId || null;
    // If userId not provided but email present, try to lookup user id
    const insertBooking = (userIdToUse) => {
      const sql = `INSERT INTO bookings (user_id, full_name, email, phone, event_type, amount, payment_id, location, booking_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      db.query(sql, [userIdToUse, name, email, phone, eventType, amount, order.id, location || null, booking_time || null], (err, result) => {
        if (err) {
          console.error('DB insert error (create-order):', err.message);
          return res.status(500).json({ success: false, error: 'Database error saving booking' });
        }
        const insertedId = result.insertId;
        // fetch the created booking to return consistent shape
        db.query('SELECT * FROM bookings WHERE id = ?', [insertedId], (err2, rows2) => {
          if (err2) {
            console.error('DB fetch after insert failed:', err2.message);
            return res.json({ success: true, order, bookingId: insertedId, key: process.env.RAZORPAY_KEY_ID });
          }
          const r = rows2[0];
          const booking = {
            id: r.id,
            full_name: r.full_name,
            event_type: r.event_type,
            location: r.location,
            booking_date: r.booking_date,
            booking_time: r.booking_time,
            status: r.status,
            payment_status: r.payment_status,
            amount: r.amount,
            payment_id: r.payment_id,
            user_id: r.user_id
          };
          console.log('New booking created:', booking);
          res.json({ success: true, order, bookingId: insertedId, booking, key: process.env.RAZORPAY_KEY_ID });
        });
      });
    };

    if (!userIdValue && email) {
      // try to find user by email
      db.query('SELECT id FROM users WHERE email = ?', [email], (err, rows) => {
        if (err) {
          console.error('User lookup failed:', err.message);
          return insertBooking(null);
        }
        if (rows && rows.length > 0) {
          insertBooking(rows[0].id);
        } else {
          insertBooking(null);
        }
      });
    } else {
      insertBooking(userIdValue || null);
    }
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

// GET BOOKINGS (for admin dashboard or for a user)
app.get("/api/bookings", (req, res) => {
  const { userId, email } = req.query;
  let sql = `SELECT * FROM bookings`;
  const params = [];

  if (userId) {
    sql += ` WHERE user_id = ?`;
    params.push(userId);
  } else if (email) {
    sql += ` WHERE email = ?`;
    params.push(email);
  }

  sql += ` ORDER BY booking_date DESC`;

  db.query(sql, params, (err, result) => {
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
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  const sql = `INSERT INTO messages (name, email, message) VALUES (?, ?, ?)`;
  db.query(sql, [name, email, message], (err) => {
    if (err) {
      console.error('Failed to save message:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to save message' });
    }
    res.json({ success: true, message: 'Message sent!' });
  });
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
// GET all messages
app.get('/api/admin/messages', (req, res) => {
  const sql = `SELECT * FROM messages ORDER BY created_at DESC`;
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Failed to fetch messages:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to fetch messages' });
    }
    res.json({ success: true, messages: result });
  });
});

// MARK MESSAGE AS READ
app.put('/api/admin/messages/:id/read', (req, res) => {
  const messageId = req.params.id;
  const sql = `UPDATE messages SET is_read=1 WHERE id=?`;
  db.query(sql, [messageId], (err, result) => {
    if (err) {
      console.error('Failed to mark message read:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to update message' });
    }
    res.json({ success: true, message: 'Message marked as read' });
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
app.put('/api/user/profile', (req, res) => {
  const { userId, name, profile_image } = req.body;

  if (!userId || !name) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  const sql = `
    UPDATE users 
    SET name = ?, profile_image = ?
    WHERE id = ?
  `;

  db.query(sql, [name, profile_image || null, userId], (err) => {
    if (err) {
      console.error('Profile update failed:', err.message);
      return res.status(500).json({ success: false, error: 'DB error' });
    }
    res.json({ success: true, message: 'Profile updated' });
  });
});

app.get('/api/user/profile/:id', (req, res) => {
  const userId = req.params.id;

  const sql = `SELECT id, name, email, profile_image FROM users WHERE id=?`;
  db.query(sql, [userId], (err, result) => {
    if (err || result.length === 0) {
      return res.status(404).json({ success: false });
    }
    res.json({ success: true, user: result[0] });
  });
});

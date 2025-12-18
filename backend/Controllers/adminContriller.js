const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.loginAdmin = (req, res) => {
  const { username, password } = req.body;
  console.log("Attempting login for:", username); // CHECK 1: Input
  const sql = "SELECT * FROM admin WHERE username = ?";
  db.query(sql, [username], (err, result) => {
    if (err) {
      console.error("DB Query Error:", err);
      return res.json({ success: false, message: "Server error" });
    }

    if (result.length === 0) {
      console.log("Error: Admin not found"); // CHECK 2: User doesn't exist
      return res.status(401).json({ success: false, message: "Admin not found" });
    }

    const admin = result[0];
    console.log("DB Hash:", admin.password); 
    console.log("Plain Text Password Length:", password.length); 
    const isMatch = bcrypt.compareSync(password, admin.password);
    
    if (!isMatch) {
      console.log("Error: Password mismatch"); // CHECK 3: Password comparison failed
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }
    const token = jwt.sign(
      { id: admin.id, username: admin.username }, 
      "YOUR_SECRET_KEY", // Make sure this is a string
      { expiresIn: '1h' }
    );
    console.log("Success: Login successful"); 
    return res.json({ success: true, token: token, message: "Login successful" });
  });
};

// Dev/debug endpoint: ping DB and return admin count
exports.ping = (req, res) => {
  const sql = 'SELECT COUNT(*) as count FROM admin';
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Ping DB error', err);
      return res.status(500).json({ success: false, message: 'DB error', error: err.message });
    }
    return res.json({ success: true, admins: result[0].count });
  });
};

// Dev/debug: Check credentials without issuing token (helps debug hashing issues)
exports.checkCredentials = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'username and password required' });
  const sql = 'SELECT * FROM admin WHERE username = ?';
  db.query(sql, [username], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error', error: err.message });
    if (result.length === 0) return res.json({ success: true, found: false, match: false, message: 'Admin not found' });
    const admin = result[0];
    const match = bcrypt.compareSync(password, admin.password);
    return res.json({ success: true, found: true, match, hash: admin.password });
  });
};

exports.getDashboardData = (req, res) => {
  return res.json({
    message: "Welcome to Madhuri Photo Studio Admin Dashboard",
    totalBookings: 12,
    pendingEdits: 5,
    revenue: 15000
  });
};

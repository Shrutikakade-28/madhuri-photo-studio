const mysql = require("mysql2");
const isProduction = process.env.NODE_ENV === "production";
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000
});

// Add promise wrapper for async/await support
const poolPromise = pool.promise();

// Test connection once
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL pool connection failed:", err.message);
  } else {
    console.log("✅ MySQL Pool Connected");
    connection.release();
  }
});

module.exports = pool;

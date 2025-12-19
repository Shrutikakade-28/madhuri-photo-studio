const mysql = require("mysql2");

const isProduction = process.env.NODE_ENV === "production";

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : undefined
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err.message);
    return;
  }
  console.log("✅ MySQL Connected");
});

module.exports = db;

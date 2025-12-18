const mysql = require("mysql2");

const dbConfig = {
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || process.env.DB_DATABASE || '',
  port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const db = mysql.createPool(dbConfig);

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err.message);
    // Helpful debug info (masked) — don't log secrets
    console.error("Connection config (masked):", {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port,
      passwordPresent: !!dbConfig.password
    });
    return;
  }
  console.log("✅ MySQL Connected");
  connection.release();
});

module.exports = db;

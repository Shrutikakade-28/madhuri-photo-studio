const db = require('../db');
const bcrypt = require('bcryptjs');

const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.error('Usage: node scripts/createAdmin.js <username> <password>');
  process.exit(1);
}

const hashed = bcrypt.hashSync(password, 10);

const sqlCheck = 'SELECT id FROM admin WHERE username = ?';
db.query(sqlCheck, [username], (err, result) => {
  if (err) {
    console.error('DB error:', err);
    process.exit(1);
  }
  if (result.length > 0) {
    const sqlUpdate = 'UPDATE admin SET password = ? WHERE username = ?';
    db.query(sqlUpdate, [hashed, username], (uErr) => {
      if (uErr) {
        console.error('Update error:', uErr);
        process.exit(1);
      }
      console.log(`Updated password for existing admin '${username}'.`);
      process.exit(0);
    });
  } else {
    const sqlInsert = 'INSERT INTO admin (username, password) VALUES (?, ?)';
    db.query(sqlInsert, [username, hashed], (iErr) => {
      if (iErr) {
        console.error('Insert error:', iErr);
        process.exit(1);
      }
      console.log(`Created admin '${username}'.`);
      process.exit(0);
    });
  }
});

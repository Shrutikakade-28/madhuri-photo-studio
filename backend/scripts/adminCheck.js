const db = require('../db');

function checkAdmins() {
  const sql = 'SELECT id, username FROM admin';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('DB query error:', err.message || err);
      process.exitCode = 2;
      return;
    }
    console.log('Admin rows found:', results.length);
    if (results.length > 0) {
      console.log('Admins:');
      results.forEach((r) => console.log(` - ${r.username} (id=${r.id})`));
    }
    process.exitCode = 0;
  });
}

checkAdmins();

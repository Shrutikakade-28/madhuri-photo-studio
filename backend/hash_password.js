const bcrypt = require('bcryptjs');

// --- CONFIGURATION ---
const plainTextPassword = 'admin123'; // <--- CHANGE THIS
const saltRounds = 10;
// ---------------------

async function hashPassword() {
  try {
    const hashedPassword = await bcrypt.hash(plainTextPassword, saltRounds);
    
    console.log(`\n✅ Original Password: ${plainTextPassword}`);
    console.log(`\n🔑 HASHED PASSWORD to use in DB:\n${hashedPassword}\n`);

  } catch (err) {
    console.error("Error hashing password:", err);
  }
}

hashPassword();
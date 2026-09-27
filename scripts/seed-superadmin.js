/**
 * Apply scripts/users-schema.sql and create the super-admin if missing.
 *
 *   SUPERADMIN_PASSWORD='...' node scripts/seed-superadmin.js
 *
 * Optional: SUPERADMIN_EMAIL (default talmonf@gmail.com)
 * Requires DATABASE_URL. Does not print or store the password.
 * If the account already exists, the password is left unchanged.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getPool } = require('../api/_lib/db');
const { hashPassword, normalizeEmail, isAcceptablePassword } = require('../api/_lib/auth');

async function main() {
  const email = normalizeEmail(process.env.SUPERADMIN_EMAIL || 'talmonf@gmail.com');
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!email) {
    console.error('SUPERADMIN_EMAIL is not a valid email address.');
    process.exit(1);
  }
  if (!isAcceptablePassword(password)) {
    console.error('Set SUPERADMIN_PASSWORD to a password of at least 10 characters.');
    process.exit(1);
  }

  const pool = getPool();
  if (!pool) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const sql = fs.readFileSync(path.join(__dirname, 'users-schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    const existing = await pool.query(`SELECT user_id FROM users WHERE email = $1`, [email]);
    if (existing.rowCount > 0) {
      console.log(`Super-admin already exists: ${email}`);
      return;
    }
    await pool.query(
      `INSERT INTO users (user_id, email, password_hash, role, must_change_password)
       VALUES ($1, $2, $3, 'super_admin', TRUE)`,
      [crypto.randomUUID(), email, hashPassword(password)]
    );
    console.log(`Created super-admin: ${email}`);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
}

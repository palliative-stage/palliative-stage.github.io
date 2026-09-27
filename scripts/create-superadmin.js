/**
 * Create talmonf@gmail.com as super-admin, or flag that account as super-admin
 * if it already exists. An existing password is left unchanged.
 *
 * Run the SQL scripts in scripts/sql yourself before this. See scripts/sql/INDEX.md.
 *
 *   DATABASE_URL='...' SUPERADMIN_PASSWORD='...' node scripts/create-superadmin.js
 *
 * SUPERADMIN_PASSWORD is required only when the account does not exist yet.
 * Use at least 10 characters. The first sign-in must change it.
 * Optional: SUPERADMIN_EMAIL (default talmonf@gmail.com)
 */

const crypto = require('crypto');
const { getPool } = require('../api/_lib/db');
const { hashPassword, normalizeEmail, isAcceptablePassword } = require('../api/_lib/auth');

async function main() {
  const email = normalizeEmail(process.env.SUPERADMIN_EMAIL || 'talmonf@gmail.com');
  if (!email) {
    console.error('SUPERADMIN_EMAIL is not a valid email address.');
    process.exit(1);
  }

  const pool = getPool();
  if (!pool) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  try {
    const existing = await pool.query(
      `SELECT user_id, role FROM users WHERE email = $1`,
      [email]
    );
    if (existing.rowCount > 0) {
      const row = existing.rows[0];
      if (row.role !== 'super_admin') {
        await pool.query(
          `UPDATE users SET role = 'super_admin', updated_at = NOW() WHERE user_id = $1`,
          [row.user_id]
        );
        console.log(`Flagged as super-admin: ${email}`);
        return;
      }
      console.log(`Super-admin already exists: ${email}`);
      return;
    }

    const password = process.env.SUPERADMIN_PASSWORD;
    if (!isAcceptablePassword(password)) {
      console.error('Set SUPERADMIN_PASSWORD to a password of at least 10 characters.');
      process.exit(1);
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
    console.error('Create super-admin failed:', err.message);
    process.exit(1);
  });
}

module.exports = { main };

/**
 * GET  /api/admin/users — list accounts (super-admin only)
 * POST /api/admin/users — create an admin or regular user
 * Body: { email, role, password }
 */

const crypto = require('crypto');
const { getPool } = require('../../lib/db');
const { sendJson, readJsonBody } = require('../../lib/http');
const {
  requireUser,
  normalizeEmail,
  isAcceptablePassword,
  hashPassword,
} = require('../../lib/auth');

function toListUser(row) {
  return {
    userId: row.user_id,
    email: row.email,
    role: row.role,
    mustChangePassword: Boolean(row.must_change_password),
    createdAt: row.created_at,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    sendJson(res, 405, { error: 'method_not_allowed' });
    return;
  }

  const pool = getPool();
  if (!pool || !process.env.AUTH_SECRET) {
    sendJson(res, 503, { error: 'unavailable' });
    return;
  }

  const actor = await requireUser(req, res, { roles: ['super_admin'] });
  if (!actor) return;

  try {
    if (req.method === 'GET') {
      const { rows } = await pool.query(
        `SELECT user_id, email, role, must_change_password, created_at
         FROM users
         ORDER BY CASE role WHEN 'super_admin' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, created_at`
      );
      sendJson(res, 200, { users: rows.map(toListUser) });
      return;
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: 'invalid_json' });
      return;
    }

    const email = normalizeEmail(body && body.email);
    const role = body && body.role;
    const password = body && body.password;
    if (!email) {
      sendJson(res, 400, { error: 'invalid_email' });
      return;
    }
    if (role !== 'admin' && role !== 'user') {
      sendJson(res, 400, { error: 'invalid_role' });
      return;
    }
    if (!isAcceptablePassword(password)) {
      sendJson(res, 400, { error: 'weak_password' });
      return;
    }

    const userId = crypto.randomUUID();
    try {
      await pool.query(
        `INSERT INTO users (user_id, email, password_hash, role, must_change_password)
         VALUES ($1, $2, $3, $4, TRUE)`,
        [userId, email, hashPassword(password), role]
      );
    } catch (err) {
      if (err && err.code === '23505') {
        sendJson(res, 409, { error: 'email_taken' });
        return;
      }
      throw err;
    }

    const { rows } = await pool.query(
      `SELECT user_id, email, role, must_change_password, created_at FROM users WHERE user_id = $1`,
      [userId]
    );
    sendJson(res, 201, { user: toListUser(rows[0]) });
  } catch (err) {
    console.error('User admin failed:', err);
    sendJson(res, 503, { error: 'unavailable' });
  }
};

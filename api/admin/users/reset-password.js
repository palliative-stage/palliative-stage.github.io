/**
 * POST /api/admin/users/reset-password
 * Body: { userId, password }
 * Sets a new initial password and requires a change on next login.
 * Super-admin accounts are not reset here.
 */

const { getPool } = require('../../lib/db');
const { sendJson, readJsonBody } = require('../../lib/http');
const { requireUser, isAcceptablePassword, hashPassword } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
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

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: 'invalid_json' });
    return;
  }

  const userId = body && body.userId;
  const password = body && body.password;
  if (typeof userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    sendJson(res, 400, { error: 'invalid_json' });
    return;
  }
  if (!isAcceptablePassword(password)) {
    sendJson(res, 400, { error: 'weak_password' });
    return;
  }

  try {
    const { rows } = await pool.query(
      `SELECT user_id, role FROM users WHERE user_id = $1`,
      [userId]
    );
    const target = rows[0];
    if (!target) {
      sendJson(res, 404, { error: 'not_found' });
      return;
    }
    if (target.role === 'super_admin') {
      sendJson(res, 403, { error: 'forbidden' });
      return;
    }

    await pool.query(
      `UPDATE users
       SET password_hash = $1, must_change_password = TRUE, failed_login_count = 0,
           locked_until = NULL, updated_at = NOW()
       WHERE user_id = $2`,
      [hashPassword(password), userId]
    );
    await pool.query(`DELETE FROM auth_sessions WHERE user_id = $1`, [userId]);
    sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error('Password reset failed:', err);
    sendJson(res, 503, { error: 'unavailable' });
  }
};

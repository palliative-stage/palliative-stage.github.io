/**
 * POST /api/auth/change-password
 * Body: { currentPassword, newPassword }
 */

const { getPool } = require('../lib/db');
const { sendJson, readJsonBody } = require('../lib/http');
const {
  requireUser,
  verifyPassword,
  isAcceptablePassword,
  hashPassword,
  isLocked,
  recordFailedLogin,
  clearFailedLogins,
  createSession,
  setSessionCookie,
  toPublicUser,
  destroySession,
} = require('../lib/auth');

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

  const user = await requireUser(req, res, { allowMustChange: true });
  if (!user) return;

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: 'invalid_json' });
    return;
  }

  const currentPassword = body && body.currentPassword;
  const newPassword = body && body.newPassword;
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    sendJson(res, 400, { error: 'invalid_json' });
    return;
  }
  if (!isAcceptablePassword(newPassword)) {
    sendJson(res, 400, { error: 'weak_password' });
    return;
  }

  try {
    const { rows } = await pool.query(
      `SELECT user_id, email, password_hash, role, must_change_password, failed_login_count, locked_until
       FROM users WHERE user_id = $1`,
      [user.user_id]
    );
    const row = rows[0];
    if (!row) {
      sendJson(res, 401, { error: 'unauthorized' });
      return;
    }
    if (isLocked(row)) {
      sendJson(res, 429, { error: 'too_many_attempts' });
      return;
    }
    if (!verifyPassword(currentPassword, row.password_hash)) {
      const result = await recordFailedLogin(pool, row);
      sendJson(res, result.locked ? 429 : 401, {
        error: result.locked ? 'too_many_attempts' : 'invalid_credentials',
      });
      return;
    }
    if (verifyPassword(newPassword, row.password_hash)) {
      sendJson(res, 400, { error: 'same_password' });
      return;
    }

    await pool.query(
      `UPDATE users
       SET password_hash = $1, must_change_password = FALSE, updated_at = NOW()
       WHERE user_id = $2`,
      [hashPassword(newPassword), row.user_id]
    );
    await clearFailedLogins(pool, row.user_id);
    await destroySession(req);
    await pool.query(`DELETE FROM auth_sessions WHERE user_id = $1`, [row.user_id]);
    const token = await createSession(pool, row.user_id);
    setSessionCookie(res, req, token);
    sendJson(res, 200, {
      user: toPublicUser({ ...row, must_change_password: false }),
    });
  } catch (err) {
    console.error('Password change failed:', err);
    sendJson(res, 503, { error: 'unavailable' });
  }
};

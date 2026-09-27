/**
 * POST /api/auth/login
 * Body: { email, password }
 */

const { getPool } = require('../_lib/db');
const { sendJson, readJsonBody } = require('../_lib/http');
const {
  normalizeEmail,
  verifyPassword,
  getDummyHash,
  isLocked,
  recordFailedLogin,
  clearFailedLogins,
  createSession,
  setSessionCookie,
  toPublicUser,
} = require('../_lib/auth');

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

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: 'invalid_json' });
    return;
  }

  const email = normalizeEmail(body && body.email);
  const password = body && body.password;
  if (!email || typeof password !== 'string') {
    sendJson(res, 401, { error: 'invalid_credentials' });
    return;
  }

  try {
    const { rows } = await pool.query(
      `SELECT user_id, email, password_hash, role, must_change_password, failed_login_count, locked_until,
              first_name, last_name, occupation
       FROM users WHERE email = $1`,
      [email]
    );
    const user = rows[0];

    if (!user) {
      verifyPassword(password, getDummyHash());
      await new Promise((resolve) => setTimeout(resolve, 400));
      sendJson(res, 401, { error: 'invalid_credentials' });
      return;
    }

    if (isLocked(user)) {
      sendJson(res, 429, { error: 'too_many_attempts' });
      return;
    }

    if (!verifyPassword(password, user.password_hash)) {
      const result = await recordFailedLogin(pool, user);
      sendJson(res, result.locked ? 429 : 401, {
        error: result.locked ? 'too_many_attempts' : 'invalid_credentials',
      });
      return;
    }

    await clearFailedLogins(pool, user.user_id);
    const token = await createSession(pool, user.user_id);
    setSessionCookie(res, req, token);
    sendJson(res, 200, {
      user: toPublicUser({ ...user, must_change_password: user.must_change_password }),
    });
  } catch (err) {
    console.error('Login failed:', err);
    sendJson(res, 503, { error: 'unavailable' });
  }
};

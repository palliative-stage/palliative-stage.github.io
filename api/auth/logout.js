/**
 * POST /api/auth/logout
 */

const { sendJson } = require('../lib/http');
const { destroySession, clearSessionCookie } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method_not_allowed' });
    return;
  }

  try {
    await destroySession(req);
  } catch (err) {
    console.error('Logout failed:', err);
  }
  clearSessionCookie(res, req);
  sendJson(res, 200, { ok: true });
};

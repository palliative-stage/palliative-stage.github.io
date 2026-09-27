/**
 * GET /api/auth/me
 */

const { sendJson } = require('../_lib/http');
const { getSessionUser, toPublicUser } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'method_not_allowed' });
    return;
  }

  try {
    const user = await getSessionUser(req);
    sendJson(res, 200, { user: user ? toPublicUser(user) : null });
  } catch (err) {
    console.error('Session lookup failed:', err);
    sendJson(res, 200, { user: null });
  }
};

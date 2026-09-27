/**
 * PATCH /api/auth/profile
 * Body: { firstName, lastName, occupation, occupationOther }
 * occupationOther is required when occupation is 'other' and ignored otherwise.
 */

const { getPool } = require('../_lib/db');
const { sendJson, readJsonBody } = require('../_lib/http');
const {
  requireUser,
  normalizePersonName,
  normalizeOccupation,
  normalizeOccupationOther,
  toPublicUser,
} = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'PATCH') {
    sendJson(res, 405, { error: 'method_not_allowed' });
    return;
  }

  const pool = getPool();
  if (!pool || !process.env.AUTH_SECRET) {
    sendJson(res, 503, { error: 'unavailable' });
    return;
  }

  const user = await requireUser(req, res);
  if (!user) return;

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: 'invalid_json' });
    return;
  }

  const firstName = normalizePersonName(body && body.firstName);
  const lastName = normalizePersonName(body && body.lastName);
  const occupation = normalizeOccupation(body && body.occupation);
  if (!firstName || !lastName) {
    sendJson(res, 400, { error: 'invalid_name' });
    return;
  }
  if (!occupation) {
    sendJson(res, 400, { error: 'invalid_occupation' });
    return;
  }
  let occupationOther = null;
  if (occupation === 'other') {
    occupationOther = normalizeOccupationOther(body && body.occupationOther);
    if (!occupationOther) {
      sendJson(res, 400, { error: 'invalid_occupation_other' });
      return;
    }
  }

  try {
    await pool.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, occupation = $3, occupation_other = $4, updated_at = NOW()
       WHERE user_id = $5`,
      [firstName, lastName, occupation, occupationOther, user.user_id]
    );
    sendJson(res, 200, {
      user: toPublicUser({
        ...user,
        first_name: firstName,
        last_name: lastName,
        occupation,
        occupation_other: occupationOther,
      }),
    });
  } catch (err) {
    console.error('Profile update failed:', err);
    sendJson(res, 503, { error: 'unavailable' });
  }
};

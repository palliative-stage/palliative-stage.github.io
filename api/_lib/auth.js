/**
 * Password hashing and cookie sessions for staff accounts.
 * Session tokens are random; only an HMAC with AUTH_SECRET is stored.
 */

const crypto = require('crypto');
const { getPool } = require('./db');

const COOKIE_NAME = 'ps_session';
const MIN_PASSWORD_LENGTH = 10;
const MAX_PASSWORD_LENGTH = 200;
const SESSION_MS = 14 * 24 * 60 * 60 * 1000;
const FAIL_LIMIT = 5;
const LOCK_MS = 15 * 60 * 1000;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 32;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 80;
const OCCUPATIONS = ['doctor', 'nurse', 'social_worker', 'other'];

let dummyHash;

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return [
    'scrypt',
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    salt.toString('base64'),
    hash.toString('base64'),
  ].join('$');
}

function verifyPassword(password, stored) {
  try {
    if (typeof password !== 'string' || typeof stored !== 'string') return false;
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
    const [, n, r, p, saltB64, hashB64] = parts;
    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(hashB64, 'base64');
    const actual = crypto.scryptSync(password, salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    if (actual.length !== expected.length) return false;
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function getDummyHash() {
  if (!dummyHash) {
    dummyHash = hashPassword('not-a-real-password');
  }
  return dummyHash;
}

function normalizeEmail(email) {
  if (typeof email !== 'string') return null;
  const value = email.trim().toLowerCase();
  if (!value || value.length > 254 || !EMAIL_RE.test(value)) return null;
  return value;
}

function normalizePersonName(value) {
  if (typeof value !== 'string') return null;
  const name = value.trim().replace(/\s+/g, ' ');
  if (!name || name.length > MAX_NAME_LENGTH) return null;
  if (/[\u0000-\u001F\u007F]/.test(name)) return null;
  return name;
}

function normalizeOccupation(value) {
  if (typeof value !== 'string' || !OCCUPATIONS.includes(value)) return null;
  return value;
}

function isAcceptablePassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= MIN_PASSWORD_LENGTH &&
    password.length <= MAX_PASSWORD_LENGTH
  );
}

function hashToken(token) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    const error = new Error('AUTH_SECRET is not set');
    error.code = 'AUTH_SECRET_MISSING';
    throw error;
  }
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
}

function readCookie(req, name) {
  const header = req.headers && req.headers.cookie;
  if (!header || typeof header !== 'string') return null;
  const parts = header.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    if (key !== name) continue;
    try {
      return decodeURIComponent(trimmed.slice(eq + 1));
    } catch {
      return null;
    }
  }
  return null;
}

function cookieSecure(req) {
  const proto = String((req.headers && req.headers['x-forwarded-proto']) || '')
    .split(',')[0]
    .trim();
  if (proto) return proto === 'https';
  return process.env.VERCEL_ENV === 'production';
}

function serializeCookie(name, value, { maxAge, secure }) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (maxAge != null) parts.push(`Max-Age=${maxAge}`);
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

function setSessionCookie(res, req, token) {
  res.setHeader(
    'Set-Cookie',
    serializeCookie(COOKIE_NAME, token, {
      maxAge: Math.floor(SESSION_MS / 1000),
      secure: cookieSecure(req),
    })
  );
}

function clearSessionCookie(res, req) {
  res.setHeader(
    'Set-Cookie',
    serializeCookie(COOKIE_NAME, '', {
      maxAge: 0,
      secure: cookieSecure(req),
    })
  );
}

function toPublicUser(row) {
  return {
    email: row.email,
    role: row.role,
    mustChangePassword: Boolean(row.must_change_password),
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    occupation: row.occupation || null,
  };
}

function isLocked(row) {
  if (!row || !row.locked_until) return false;
  return new Date(row.locked_until).getTime() > Date.now();
}

async function recordFailedLogin(pool, user) {
  const fails = Number(user.failed_login_count || 0) + 1;
  const lockedUntil = fails >= FAIL_LIMIT ? new Date(Date.now() + LOCK_MS) : null;
  await pool.query(
    `UPDATE users
     SET failed_login_count = $1, locked_until = $2, updated_at = NOW()
     WHERE user_id = $3`,
    [fails, lockedUntil, user.user_id]
  );
  const delay = Math.min(200 + fails * 150, 1500);
  await new Promise((resolve) => setTimeout(resolve, delay));
  return { locked: Boolean(lockedUntil) };
}

async function clearFailedLogins(pool, userId) {
  await pool.query(
    `UPDATE users
     SET failed_login_count = 0, locked_until = NULL, updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  );
}

async function createSession(pool, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_MS);
  await pool.query(`DELETE FROM auth_sessions WHERE expires_at < NOW()`);
  await pool.query(
    `INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)`,
    [hashToken(token), userId, expiresAt.toISOString()]
  );
  return token;
}

async function destroySession(req) {
  const token = readCookie(req, COOKIE_NAME);
  const pool = getPool();
  if (!token || !pool || !process.env.AUTH_SECRET) return;
  await pool.query(`DELETE FROM auth_sessions WHERE token_hash = $1`, [hashToken(token)]);
}

async function getSessionUser(req) {
  const token = readCookie(req, COOKIE_NAME);
  if (!token || !process.env.AUTH_SECRET) return null;
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(
    `SELECT u.user_id, u.email, u.role, u.must_change_password, u.failed_login_count, u.locked_until,
            u.first_name, u.last_name, u.occupation
     FROM auth_sessions s
     JOIN users u ON u.user_id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [hashToken(token)]
  );
  return rows[0] || null;
}

async function requireUser(req, res, { roles, allowMustChange = false } = {}) {
  const { sendJson } = require('./http');
  let user;
  try {
    user = await getSessionUser(req);
  } catch (err) {
    console.error('Session lookup failed:', err);
    sendJson(res, 503, { error: 'unavailable' });
    return null;
  }
  if (!user) {
    sendJson(res, 401, { error: 'unauthorized' });
    return null;
  }
  if (!allowMustChange && user.must_change_password) {
    sendJson(res, 403, { error: 'password_change_required' });
    return null;
  }
  if (roles && !roles.includes(user.role)) {
    sendJson(res, 403, { error: 'forbidden' });
    return null;
  }
  return user;
}

module.exports = {
  COOKIE_NAME,
  MIN_PASSWORD_LENGTH,
  hashPassword,
  verifyPassword,
  getDummyHash,
  normalizeEmail,
  normalizePersonName,
  normalizeOccupation,
  isAcceptablePassword,
  hashToken,
  readCookie,
  setSessionCookie,
  clearSessionCookie,
  toPublicUser,
  isLocked,
  recordFailedLogin,
  clearFailedLogins,
  createSession,
  destroySession,
  getSessionUser,
  requireUser,
};

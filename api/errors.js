/**
 * Error logging API endpoint.
 * POST /api/errors — report known errors or check a clicked URL server-side.
 */

const { Pool } = require('pg');
const UAParser = require('ua-parser-js');
const { sendErrorAlert } = require('./lib/mail');

function buildConnectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (/uselibpqcompat=true/i.test(url)) return url;
  if (/sslmode=(prefer|require|verify-ca)(?=(&|$))/i.test(url)) {
    return url.replace(/sslmode=(prefer|require|verify-ca)(?=(&|$))/i, 'sslmode=verify-full');
  }
  if (/sslmode=/i.test(url)) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}sslmode=verify-full`;
}

let pool;
function getPool() {
  if (!pool) {
    const connectionString = buildConnectionString();
    if (!connectionString) return null;
    pool = new Pool({
      connectionString,
      max: 2,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

const PROBE_TIMEOUT_MS = 5000;
const PROBE_USER_AGENT = 'PalliativeSiteErrorChecker/1.0';
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const rateLimitMap = new Map();

function getDeviceType(userAgent) {
  if (!userAgent) return 'desktop';
  const parser = new UAParser(userAgent);
  const device = parser.getDevice();
  if (device.type === 'mobile' && !device.model) return 'mobile';
  if (device.type === 'tablet') return 'tablet';
  return 'desktop';
}

function computePageRoute(pageUrl) {
  if (!pageUrl || typeof pageUrl !== 'string') return null;
  try {
    const url = new URL(pageUrl);
    const route = (url.pathname || '') + (url.hash || '');
    return route.slice(0, 500) || null;
  } catch {
    return null;
  }
}

function getReferrerDomain(referrer) {
  if (!referrer || typeof referrer !== 'string') return null;
  try {
    const url = new URL(referrer);
    return url.hostname || null;
  } catch {
    return null;
  }
}

function normalizeFailedUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const url = new URL(raw);
    url.hash = '';
    return url.toString().slice(0, 2000);
  } catch {
    return raw.trim().slice(0, 2000) || null;
  }
}

function isProbeableUrl(raw) {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith('#')) return false;
  if (/^(mailto:|tel:|javascript:)/i.test(trimmed)) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildExtra(payload) {
  const extra = {};
  if (payload.page_title != null) extra.page_title = payload.page_title;
  if (payload.viewport_width != null) extra.viewport_width = payload.viewport_width;
  if (payload.viewport_height != null) extra.viewport_height = payload.viewport_height;
  if (payload.probe_method != null) extra.probe_method = payload.probe_method;
  if (payload.probe_error != null) extra.probe_error = payload.probe_error;
  return Object.keys(extra).length > 0 ? extra : null;
}

function setCorsHeaders(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

async function probeUrl(rawUrl) {
  const url = normalizeFailedUrl(rawUrl);
  if (!url) {
    return { ok: false, skipped: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    let method = 'HEAD';
    let response = await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': PROBE_USER_AGENT },
    });

    if (response.status === 405 || response.status === 501) {
      method = 'GET';
      response = await fetch(url, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': PROBE_USER_AGENT },
      });
    }

    return {
      ok: response.status < 400,
      statusCode: response.status,
      failedUrl: url,
      probeMethod: method,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: null,
      failedUrl: url,
      probeMethod: 'HEAD',
      probeError: err.name === 'AbortError' ? 'timeout' : String(err.message || err).slice(0, 255),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function wasRecentlyEmailed(client, failedUrl, errorType) {
  const result = await client.query(
    `SELECT 1 FROM errors
     WHERE failed_url = $1 AND error_type = $2
       AND email_sent_at IS NOT NULL
       AND email_sent_at > NOW() - INTERVAL '24 hours'
     LIMIT 1`,
    [failedUrl, errorType]
  );
  return result.rowCount > 0;
}

async function insertError(client, row, meta) {
  const parser = new UAParser(row.user_agent || '');
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const deviceType = meta.device_type || getDeviceType(row.user_agent);
  const pageRoute = computePageRoute(row.page_url);
  const extra = buildExtra(row);
  const now = new Date().toISOString();

  await client.query(
    `INSERT INTO errors (
      error_id, occurred_at, error_type, status_code, failed_url, link_text,
      page_url, page_route, session_id, user_pseudo_id, country, device_type,
      browser_name, os_name, language, referrer_domain, extra
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
    )`,
    [
      row.error_id,
      row.occurred_at || now,
      row.error_type,
      row.status_code != null ? row.status_code : null,
      row.failed_url || null,
      row.link_text ? String(row.link_text).slice(0, 255) : null,
      row.page_url || null,
      pageRoute,
      row.session_id,
      row.user_pseudo_id || null,
      meta.country,
      deviceType,
      browser.name || null,
      os.name || null,
      meta.language,
      row.referrer_domain != null ? row.referrer_domain : getReferrerDomain(row.referrer),
      extra ? JSON.stringify(extra) : null,
    ]
  );
}

async function maybeSendAlert(client, row) {
  if (!row.failed_url || !row.error_type) return;

  const recentlyEmailed = await wasRecentlyEmailed(client, row.failed_url, row.error_type);
  if (recentlyEmailed) return;

  const result = await sendErrorAlert(row);
  if (result.sent) {
    await client.query(
      `UPDATE errors SET email_sent_at = NOW() WHERE error_id = $1`,
      [row.error_id]
    );
  }
}

async function parseBody(req) {
  if (req.body !== undefined) {
    return req.body;
  }
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : null);
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  const allowedOrigins = (process.env.ERRORS_ALLOWED_ORIGINS || process.env.ANALYTICS_ALLOWED_ORIGINS || '*')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const origin = req.headers.origin;
  const corsOrigin =
    allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))
      ? origin || '*'
      : allowedOrigins[0] || '*';

  setCorsHeaders(res, corsOrigin);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body;
  try {
    body = await parseBody(req);
  } catch {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'Invalid JSON' });
      return;
    }
  }

  if (!body || !body.error_id || !body.session_id) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const dbPool = getPool();
  if (!dbPool) {
    res.status(204).end();
    return;
  }

  const meta = {
    country: req.headers['x-vercel-ip-country'] || null,
    language: (req.headers['accept-language'] || '').split(',')[0]?.trim() || null,
    device_type: getDeviceType(req.headers['user-agent']),
  };

  let row = { ...body };

  if (body.action === 'check_url') {
    if (!checkRateLimit(getClientIp(req))) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    const failedUrl = normalizeFailedUrl(body.failed_url);
    if (!failedUrl || !isProbeableUrl(failedUrl)) {
      res.status(204).end();
      return;
    }

    const probe = await probeUrl(failedUrl);
    if (probe.skipped || probe.ok) {
      res.status(204).end();
      return;
    }

    row = {
      ...body,
      failed_url: probe.failedUrl,
      error_type: probe.statusCode != null ? 'link_http_error' : 'link_network_error',
      status_code: probe.statusCode,
      probe_method: probe.probeMethod,
      probe_error: probe.probeError,
    };
  } else if (!body.error_type) {
    res.status(400).json({ error: 'Missing error_type' });
    return;
  } else {
    row.failed_url = normalizeFailedUrl(body.failed_url) || body.failed_url || null;
  }

  const client = await dbPool.connect();
  try {
    await insertError(client, row, meta);
    await maybeSendAlert(client, row);
    res.status(204).end();
  } catch (err) {
    console.error('Errors API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

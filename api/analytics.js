/**
 * Privacy-friendly analytics API endpoint.
 * POST /api/analytics - accepts single event or array of events.
 */

const { Pool } = require('pg');
const UAParser = require('ua-parser-js');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  idleTimeoutMillis: 5000,
});

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

function buildExtra(payload) {
  const extra = {};
  if (payload.page_title != null) extra.page_title = payload.page_title;
  if (payload.viewport_width != null) extra.viewport_width = payload.viewport_width;
  if (payload.viewport_height != null) extra.viewport_height = payload.viewport_height;
  if (payload.user_agent != null) extra.user_agent = payload.user_agent;
  if (payload.user_pseudo_id != null) extra.user_pseudo_id = payload.user_pseudo_id;
  if (payload.entry_hostname != null) extra.entry_hostname = payload.entry_hostname;
  if (payload.entry_origin != null) extra.entry_origin = payload.entry_origin;
  if (payload.entry_url != null) extra.entry_url = payload.entry_url;
  return Object.keys(extra).length > 0 ? extra : null;
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

async function processEvent(client, event, meta) {
  const {
    event_id,
    event_type,
    occurred_at,
    page_url,
    page_title,
    session_id,
    user_pseudo_id,
    user_agent,
    viewport_width,
    viewport_height,
    entry_hostname,
    entry_origin,
    entry_url,
    referrer_domain: refDomain,
    utm_source,
    utm_medium,
    utm_campaign,
    section,
    element_id,
    element_type,
    element_text_short,
    search_query,
    results_count,
    search_location,
    entry_id,
  } = event;

  const parser = new UAParser(user_agent || '');
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const deviceType = meta.device_type || getDeviceType(user_agent);
  const country = meta.country || null;
  const language = meta.language || null;
  const referrerDomain = refDomain != null ? refDomain : getReferrerDomain(event.referrer);
  const pageRoute = computePageRoute(page_url);
  const extra = buildExtra(event);

  const now = new Date().toISOString();

  await client.query(
    `INSERT INTO sessions (session_id, user_pseudo_id, country, device_type, first_event_at, last_event_at, first_seen_at, last_seen_at)
     VALUES ($1, $2, $3, $4, $5, $5, $5, $5)
     ON CONFLICT (session_id) DO UPDATE SET
       last_event_at = EXCLUDED.last_event_at,
       last_seen_at = EXCLUDED.last_seen_at`,
    [session_id, user_pseudo_id || null, country, deviceType, occurred_at || now]
  );

  await client.query(
    `INSERT INTO events (
      event_id, session_id, event_type, occurred_at, page_url, page_route, section,
      element_id, element_type, element_text_short, search_query, results_count, search_location,
      extra, entry_id, country, device_type, browser_name, os_name, language,
      referrer_domain, utm_source, utm_medium, utm_campaign
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
    )`,
    [
      event_id,
      session_id,
      event_type,
      occurred_at || now,
      page_url || null,
      pageRoute,
      section || null,
      element_id || null,
      element_type || null,
      element_text_short ? String(element_text_short).slice(0, 255) : null,
      search_query || null,
      results_count != null ? results_count : null,
      search_location || null,
      extra ? JSON.stringify(extra) : null,
      entry_id ? String(entry_id).slice(0, 255) : null,
      country,
      deviceType,
      browser.name || null,
      os.name || null,
      language,
      referrerDomain,
      utm_source ? String(utm_source).slice(0, 255) : null,
      utm_medium ? String(utm_medium).slice(0, 255) : null,
      utm_campaign ? String(utm_campaign).slice(0, 255) : null,
    ]
  );
}

function setCorsHeaders(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

module.exports = async function handler(req, res) {
  const allowedOrigins = (process.env.ANALYTICS_ALLOWED_ORIGINS || '*')
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
    if (req.body !== undefined) {
      body = req.body;
    } else {
      body = await new Promise((resolve, reject) => {
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

  const events = Array.isArray(body) ? body : body ? [body] : [];
  if (events.length === 0) {
    res.status(204).end();
    return;
  }

  const meta = {
    country: req.headers['x-vercel-ip-country'] || null,
    language: (req.headers['accept-language'] || '').split(',')[0]?.trim() || null,
    device_type: getDeviceType(req.headers['user-agent']),
  };

  const client = await pool.connect();
  try {
    for (const ev of events) {
      if (ev && ev.event_id && ev.session_id && ev.event_type) {
        await processEvent(client, ev, meta);
      }
    }
    res.status(204).end();
  } catch (err) {
    console.error('Analytics API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

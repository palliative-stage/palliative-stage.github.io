/**
 * GET /api/admin/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD&hideAdmins=1&userId=<uuid>
 * Aggregates for admin and super-admin. Defaults: last 30 days, hide admins, all users.
 * hideAdmins is ignored when userId is set.
 */

const { getPool } = require('../_lib/db');
const { sendJson } = require('../_lib/http');
const { requireUser } = require('../_lib/auth');
const { resolveAnalyticsRange, enumerateDays } = require('../_lib/analyticsRange');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function rangeSql(alias) {
  const occurred = alias ? `${alias}.occurred_at` : 'occurred_at';
  const role = alias ? `${alias}.actor_role` : 'actor_role';
  const userId = alias ? `${alias}.user_id` : 'user_id';
  return `
    ${occurred} >= ($1::date::timestamp AT TIME ZONE 'Asia/Jerusalem')
    AND ${occurred} < (($2::date + 1)::timestamp AT TIME ZONE 'Asia/Jerusalem')
    AND (
      NOT $3::boolean
      OR ${role} IS NULL
      OR ${role} = 'user'
    )
    AND ($4::uuid IS NULL OR ${userId} = $4::uuid)
  `;
}

function hideAdminsFromQuery(query) {
  const raw = query && query.hideAdmins;
  if (raw == null || raw === '') return true;
  return raw === '1' || raw === 'true';
}

function pageRouteSql(alias) {
  return `MODE() WITHIN GROUP (ORDER BY NULLIF(split_part(${alias}.page_route, '#', 1), ''))`;
}

function userLabel(row) {
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ');
  return name ? `${name} (${row.email})` : row.email;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'method_not_allowed' });
    return;
  }

  const pool = getPool();
  if (!pool || !process.env.AUTH_SECRET) {
    sendJson(res, 503, { error: 'unavailable' });
    return;
  }

  const actor = await requireUser(req, res, { roles: ['admin', 'super_admin'] });
  if (!actor) return;

  const query = req.query || {};
  const range = resolveAnalyticsRange({ from: query.from, to: query.to });
  if (range.error) {
    sendJson(res, 400, { error: range.error });
    return;
  }

  const rawUserId = typeof query.userId === 'string' ? query.userId : '';
  if (rawUserId && !UUID_RE.test(rawUserId)) {
    sendJson(res, 400, { error: 'invalid_user' });
    return;
  }
  const userId = rawUserId || null;
  const hideAdmins = userId ? false : hideAdminsFromQuery(query);
  const params = [range.from, range.to, hideAdmins, userId];
  const where = rangeSql('e');

  try {
    const usersResult = await pool.query(
      `SELECT user_id, email, first_name, last_name
       FROM users
       ORDER BY NULLIF(first_name, '') NULLS LAST, NULLIF(last_name, '') NULLS LAST, email`
    );

    const summaryResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE e.event_type = 'page_view')::int AS page_views,
         COUNT(DISTINCT s.user_pseudo_id)::int AS visitors,
         COUNT(DISTINCT e.session_id)::int AS sessions,
         COUNT(*) FILTER (WHERE e.event_type = 'search')::int AS searches,
         COUNT(*) FILTER (WHERE e.event_type = 'click')::int AS clicks,
         COUNT(*) FILTER (WHERE e.event_type = 'search' AND e.results_count = 0)::int AS zero_result_searches
       FROM events e
       JOIN sessions s ON s.session_id = e.session_id
       WHERE ${where}`,
      params
    );

    const dailyResult = await pool.query(
      `SELECT to_char((e.occurred_at AT TIME ZONE 'Asia/Jerusalem')::date, 'YYYY-MM-DD') AS day,
              COUNT(*)::int AS views
       FROM events e
       WHERE e.event_type = 'page_view' AND ${where}
       GROUP BY 1
       ORDER BY 1`,
      params
    );

    const pagesResult = await pool.query(
      `SELECT COALESCE(NULLIF(e.entry_id, ''), NULLIF(e.page_route, ''), '—') AS page,
              ${pageRouteSql('e')} AS route,
              COUNT(*)::int AS views
       FROM events e
       WHERE e.event_type = 'page_view' AND ${where}
       GROUP BY 1
       ORDER BY views DESC, page ASC
       LIMIT 12`,
      params
    );

    const searchResult = await pool.query(
      `SELECT e.search_query AS query,
              COUNT(*)::int AS searches,
              COUNT(*) FILTER (WHERE e.results_count = 0)::int AS zero_results
       FROM events e
       WHERE e.event_type = 'search'
         AND e.search_query IS NOT NULL
         AND e.search_query <> ''
         AND ${where}
       GROUP BY 1
       ORDER BY searches DESC, query ASC
       LIMIT 12`,
      params
    );

    const clickResult = await pool.query(
      `SELECT COALESCE(NULLIF(e.element_text_short, ''), NULLIF(e.element_id, ''), '—') AS label,
              e.element_id AS element_id,
              COALESCE(NULLIF(e.entry_id, ''), NULLIF(split_part(e.page_route, '#', 1), '')) AS page,
              ${pageRouteSql('e')} AS route,
              COUNT(*)::int AS clicks
       FROM events e
       WHERE e.event_type = 'click' AND ${where}
       GROUP BY 1, 2, 3
       ORDER BY clicks DESC, label ASC
       LIMIT 20`,
      params
    );

    const deviceResult = await pool.query(
      `SELECT COALESCE(NULLIF(e.device_type, ''), NULLIF(s.device_type, ''), 'unknown') AS key,
              COUNT(DISTINCT e.session_id)::int AS sessions
       FROM events e
       JOIN sessions s ON s.session_id = e.session_id
       WHERE ${where}
       GROUP BY 1
       ORDER BY sessions DESC, key ASC
       LIMIT 8`,
      params
    );

    const referrerResult = await pool.query(
      `SELECT COALESCE(NULLIF(e.referrer_domain, ''), 'direct') AS key,
              COUNT(DISTINCT e.session_id)::int AS sessions
       FROM events e
       WHERE ${where}
       GROUP BY 1
       ORDER BY sessions DESC, key ASC
       LIMIT 8`,
      params
    );

    const countryResult = await pool.query(
      `SELECT COALESCE(NULLIF(e.country, ''), NULLIF(s.country, ''), 'unknown') AS key,
              COUNT(DISTINCT e.session_id)::int AS sessions
       FROM events e
       JOIN sessions s ON s.session_id = e.session_id
       WHERE ${where}
       GROUP BY 1
       ORDER BY sessions DESC, key ASC
       LIMIT 8`,
      params
    );

    const summaryRow = summaryResult.rows[0] || {};
    const summary = {
      pageViews: summaryRow.page_views || 0,
      visitors: summaryRow.visitors || 0,
      sessions: summaryRow.sessions || 0,
      searches: summaryRow.searches || 0,
      clicks: summaryRow.clicks || 0,
      zeroResultSearches: summaryRow.zero_result_searches || 0,
    };
    const pageViewsTotal = summary.pageViews || 0;
    const byDay = new Map(dailyResult.rows.map((row) => [row.day, row.views]));

    sendJson(res, 200, {
      from: range.from,
      to: range.to,
      hideAdmins,
      userId,
      users: usersResult.rows.map((row) => ({ userId: row.user_id, label: userLabel(row) })),
      empty:
        summary.pageViews === 0 &&
        summary.searches === 0 &&
        summary.clicks === 0 &&
        summary.sessions === 0,
      summary,
      dailyPageViews: enumerateDays(range.from, range.to).map((day) => ({
        day,
        views: byDay.get(day) || 0,
      })),
      topPages: pagesResult.rows.map((row) => ({
        page: row.page,
        route: row.route,
        views: row.views,
        share: pageViewsTotal ? row.views / pageViewsTotal : 0,
      })),
      topSearches: searchResult.rows.map((row) => ({
        query: row.query,
        searches: row.searches,
        zeroResults: row.zero_results,
      })),
      topClicks: clickResult.rows.map((row) => ({
        label: row.label,
        elementId: row.element_id,
        page: row.page,
        route: row.route,
        clicks: row.clicks,
      })),
      audience: {
        devices: deviceResult.rows,
        referrers: referrerResult.rows,
        countries: countryResult.rows,
      },
    });
  } catch (err) {
    console.error('Analytics query failed:', err);
    sendJson(res, 503, { error: 'unavailable' });
  }
};

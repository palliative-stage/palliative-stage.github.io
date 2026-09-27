import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { usePluginData } from '@docusaurus/useGlobalData';
import StaffShell from '@site/src/components/StaffShell';
import { staffFetch } from '@site/src/lib/staffApi';
import { useStaffSession } from '@site/src/lib/useStaffSession';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_X_LABELS = 8;
const Y_TICKS = 4;
const numberFormat = new Intl.NumberFormat('he-IL');
const percentFormat = new Intl.NumberFormat('he-IL', {
  style: 'percent',
  maximumFractionDigits: 1,
});
const dayFormat = new Intl.DateTimeFormat('he-IL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const DEVICE_LABELS = {
  desktop: 'מחשב',
  mobile: 'נייד',
  tablet: 'טאבלט',
  unknown: 'לא ידוע',
};

const countryNames =
  typeof Intl !== 'undefined' && Intl.DisplayNames
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

const ERRORS = {
  invalid_range: 'טווח התאריכים אינו תקין.',
  range_too_long: 'ניתן לבחור עד 366 ימים.',
  invalid_user: 'המשתמש שנבחר אינו תקין.',
  unavailable: 'לא ניתן לטעון את הנתונים. נסו שוב.',
};

function jerusalemToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function addIsoDays(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function defaultRange() {
  const to = jerusalemToday();
  return { from: addIsoDays(to, -29), to };
}

function formatIso(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return dayFormat.format(new Date(Date.UTC(year, month - 1, day)));
}

function activePreset(from, to) {
  const today = jerusalemToday();
  if (to !== today) return null;
  return [7, 30, 90].find((days) => from === addIsoDays(today, -(days - 1))) || null;
}

function formatDayMonth(iso) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

function siteHostnames(siteUrl) {
  const hosts = [];
  try {
    const host = new URL(siteUrl).hostname.replace(/^www\./, '');
    hosts.push(host, `www.${host}`);
  } catch {}
  if (typeof window !== 'undefined') hosts.push(window.location.hostname);
  return hosts;
}

function niceAxis(max) {
  if (max <= 0) return { top: 1, step: 1 };
  const raw = max / Y_TICKS;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = Math.max(1, factor * magnitude);
  return { top: Math.ceil(max / step) * step, step };
}

function inclusiveDays(from, to) {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000) + 1;
}

export default function AnalyticsPage() {
  const history = useHistory();
  const location = useLocation();
  const { siteConfig } = useDocusaurusContext();
  const { loading: sessionLoading, user } = useStaffSession();
  const siteHosts = siteHostnames(siteConfig.url);
  const { pages: sitePages = [] } = usePluginData('page-titles-plugin') || {};
  const titleToPath = new Map(sitePages.map((page) => [page.title, page.path]));
  const pathToTitle = new Map(sitePages.map((page) => [page.path, page.title]));
  const initial = defaultRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [hideAdmins, setHideAdmins] = useState(true);
  const [userId, setUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [ready, setReady] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allowed = Boolean(
    user && !user.mustChangePassword && (user.role === 'admin' || user.role === 'super_admin')
  );

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      window.location.replace('/login');
      return;
    }
    if (user.mustChangePassword) {
      window.location.replace('/account/password');
      return;
    }
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      window.location.replace('/');
    }
  }, [sessionLoading, user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFrom = params.get('from');
    const urlTo = params.get('to');
    if (urlFrom && urlTo && DATE_RE.test(urlFrom) && DATE_RE.test(urlTo)) {
      setFrom(urlFrom);
      setTo(urlTo);
    }
    if (params.get('hideAdmins') === '0') setHideAdmins(false);
    const urlUser = params.get('userId');
    if (urlUser && UUID_RE.test(urlUser)) setUserId(urlUser);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !allowed) return undefined;
    if (!DATE_RE.test(from) || !DATE_RE.test(to) || from > to) {
      setError(ERRORS.invalid_range);
      setReport(null);
      setLoading(false);
      return undefined;
    }
    if (inclusiveDays(from, to) > 366) {
      setError(ERRORS.range_too_long);
      setReport(null);
      setLoading(false);
      return undefined;
    }

    const search =
      `?from=${from}&to=${to}&hideAdmins=${hideAdmins ? '1' : '0'}` +
      (userId ? `&userId=${userId}` : '');
    if (location.search !== search) {
      history.replace({ pathname: location.pathname, search });
    }

    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError('');
    staffFetch(`/api/admin/analytics${search}`, { signal: controller.signal })
      .then(({ ok, status, data }) => {
        if (cancelled) return;
        if (status === 401) {
          window.location.replace('/login');
          return;
        }
        if (status === 403 && data && data.error === 'password_change_required') {
          window.location.replace('/account/password');
          return;
        }
        if (!ok || !data) {
          setReport(null);
          setError(ERRORS[(data && data.error) || 'unavailable'] || ERRORS.unavailable);
          setLoading(false);
          return;
        }
        setReport(data);
        if (data.users) setUsers(data.users);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled || (err && err.name === 'AbortError')) return;
        setReport(null);
        setError(ERRORS.unavailable);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [ready, allowed, from, to, hideAdmins, userId, history, location.pathname, location.search]);

  useEffect(() => {
    if (!userId || userQuery) return;
    const match = users.find((item) => item.userId === userId);
    if (match) setUserQuery(match.label);
  }, [users, userId, userQuery]);

  const preset = activePreset(from, to);

  function onUserQuery(value) {
    setUserQuery(value);
    const match = users.find((item) => item.label === value);
    setUserId(match ? match.userId : '');
  }

  function applyPreset(days) {
    const today = jerusalemToday();
    setFrom(addIsoDays(today, -(days - 1)));
    setTo(today);
  }

  return (
    <StaffShell title="אנליטיקה">
      <h1>אנליטיקה</h1>
      <form className="staff-filters" onSubmit={(event) => event.preventDefault()}>
        <div className="staff-presets" role="group" aria-label="טווח תאריכים">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              type="button"
              className={`button button--sm ${preset === days ? 'button--primary' : 'button--outline button--primary'}`}
              aria-pressed={preset === days}
              onClick={() => applyPreset(days)}
            >
              {days} ימים
            </button>
          ))}
        </div>
        <label>
          מתאריך
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label>
          עד תאריך
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <label>
          משתמש
          <span className="staff-user-filter">
            <input
              type="search"
              list="staff-analytics-users"
              placeholder="כל המשתמשים"
              value={userQuery}
              onChange={(event) => onUserQuery(event.target.value)}
            />
            <datalist id="staff-analytics-users">
              {users.map((item) => (
                <option key={item.userId} value={item.label} />
              ))}
            </datalist>
          </span>
        </label>
        <label className="staff-check">
          <input
            type="checkbox"
            checked={hideAdmins && !userId}
            disabled={Boolean(userId)}
            onChange={(event) => setHideAdmins(event.target.checked)}
          />
          הסתר פעילות מנהלים
        </label>
      </form>

      {!allowed || (loading && !report) ? <p>טוען...</p> : null}
      {error && (
        <p className="staff-error" role="alert">
          {error}
        </p>
      )}

      {report && report.empty && !error && (
        <div className="staff-card">
          <p>אין נתונים בטווח שנבחר.</p>
        </div>
      )}

      {report && !report.empty && !error && (
        <>
          <p className="staff-muted">
            {formatIso(report.from)} – {formatIso(report.to)}
            {loading ? ' · טוען...' : ''}
          </p>
          <section className="staff-kpis" aria-label="סיכום">
            <Kpi label="צפיות" value={report.summary.pageViews} />
            <Kpi label="מבקרים" value={report.summary.visitors} />
            <Kpi label="סשנים" value={report.summary.sessions} />
            <Kpi label="חיפושים" value={report.summary.searches} />
            <Kpi label="לחיצות" value={report.summary.clicks} />
          </section>

          <section className="staff-card">
            <h2>פעילות לאורך זמן</h2>
            <DailyChart points={report.dailyPageViews} />
          </section>

          <div className="staff-grid-2">
            <section className="staff-card">
              <h2>הדפים הנצפים ביותר</h2>
              {report.topPages.length === 0 ? (
                <p>אין נתונים</p>
              ) : (
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>דף</th>
                      <th>צפיות</th>
                      <th>חלק</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topPages.map((row) => (
                      <tr key={row.route || '—'}>
                        <td>
                          <PageLink
                            page={(row.route && pathToTitle.get(row.route)) || row.route || '—'}
                            route={row.route}
                          />
                        </td>
                        <td>{numberFormat.format(row.views)}</td>
                        <td>{percentFormat.format(row.share)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section>
              <h2>קהל</h2>
              <AudienceCard
                title="מדינה"
                rows={report.audience.countries}
                labelFor={countryLabel}
                tableDir="ltr"
              />
              <AudienceCard title="מכשיר" rows={report.audience.devices} labelFor={deviceLabel} />
              <AudienceCard title="מקור" rows={report.audience.referrers} labelFor={referrerLabel} />
            </section>
          </div>

          <section className="staff-card">
            <h2>לחיצות</h2>
            {report.topClicks.length === 0 ? (
              <p>אין נתונים</p>
            ) : (
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>לחיצה</th>
                    <th>בדף</th>
                    <th>פעמים</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topClicks.map((row) => (
                    <tr key={`${row.label}-${row.elementId || ''}-${row.page || ''}`}>
                      <td>
                        {row.label}
                        {row.elementId &&
                          row.elementId !== row.label &&
                          !siteHosts.includes(row.elementId) && (
                            <span className="staff-muted"> · {row.elementId}</span>
                          )}
                      </td>
                      <td>
                        {row.page ? <PageLink page={row.page} route={titleToPath.get(row.page)} /> : '—'}
                      </td>
                      <td>{numberFormat.format(row.clicks)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="staff-card">
            <h2>חיפוש</h2>
            <p className="staff-callout">
              חיפושים ללא תוצאות: {numberFormat.format(report.summary.zeroResultSearches)}
            </p>
            {report.topSearches.length === 0 ? (
              <p>אין נתונים</p>
            ) : (
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>חיפוש</th>
                    <th>פעמים</th>
                    <th>ללא תוצאות</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topSearches.map((row) => (
                    <tr key={row.query}>
                      <td>{row.query}</td>
                      <td>{numberFormat.format(row.searches)}</td>
                      <td>{numberFormat.format(row.zeroResults)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </StaffShell>
  );
}

function PageLink({ page, route }) {
  if (!route) return page;
  return (
    <a href={route} target="_blank" rel="noopener noreferrer">
      {page}
    </a>
  );
}

function DailyChart({ points }) {
  const [active, setActive] = useState(null);
  const max = points.reduce((result, point) => Math.max(result, point.views), 0);
  const { top, step } = niceAxis(max);
  const ticks = [];
  for (let value = 0; value <= top; value += step) ticks.push(value);
  const labelEvery = Math.max(1, Math.ceil(points.length / MAX_X_LABELS));
  const edge = Math.max(1, Math.floor(points.length * 0.15));

  function tooltipPosition(index) {
    if (index < edge) return { insetInlineStart: 0 };
    if (index >= points.length - edge) return { insetInlineEnd: 0 };
    return { left: '50%', transform: 'translateX(-50%)' };
  }

  return (
    <div
      className="staff-chart"
      role="img"
      aria-label={`צפיות יומיות, שיא ${numberFormat.format(max)}`}
      onMouseLeave={() => setActive(null)}
    >
      <div className="staff-chart__y" aria-hidden="true">
        <span className="staff-chart__y-size">{numberFormat.format(top)}</span>
        {ticks.map((value) => (
          <span key={value} style={{ bottom: `${(value / top) * 100}%` }}>
            {numberFormat.format(value)}
          </span>
        ))}
      </div>
      <div className="staff-chart__plot">
        {ticks.map((value) => (
          <div
            key={value}
            className="staff-chart__grid"
            style={{ bottom: `${(value / top) * 100}%` }}
          />
        ))}
        <div className="staff-chart__bars">
          {points.map((point, index) => (
            <div
              key={point.day}
              className={`staff-chart__col${active === index ? ' staff-chart__col--active' : ''}`}
              onMouseEnter={() => setActive(index)}
              onClick={() => setActive((current) => (current === index ? null : index))}
            >
              <div
                className="staff-chart__bar"
                style={{ height: point.views ? `${(point.views / top) * 100}%` : '0%' }}
              />
              {active === index && (
                <div className="staff-chart__tooltip" style={tooltipPosition(index)}>
                  <bdi dir="ltr">{formatDayMonth(point.day)}</bdi>
                  <strong>{numberFormat.format(point.views)} צפיות</strong>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div />
      <div className="staff-chart__x" aria-hidden="true">
        {points.map((point, index) => (
          <span key={point.day}>
            {index % labelEvery === 0 && <bdi dir="ltr">{formatDayMonth(point.day)}</bdi>}
          </span>
        ))}
      </div>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="staff-kpi">
      <span>{label}</span>
      <strong>{numberFormat.format(value)}</strong>
    </div>
  );
}

function deviceLabel(key) {
  return DEVICE_LABELS[key] || key;
}

function countryLabel(key) {
  if (key === 'unknown') return 'Unknown';
  try {
    return (countryNames && countryNames.of(key)) || key;
  } catch {
    return key;
  }
}

function referrerLabel(key) {
  if (key === 'direct') return 'ישיר';
  return key;
}

function AudienceCard({ title, rows, labelFor, tableDir }) {
  return (
    <div className="staff-card">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p>אין נתונים</p>
      ) : (
        <table className="staff-table" dir={tableDir}>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>
                  <bdi dir="ltr">{labelFor(row.key)}</bdi>
                </td>
                <td>{numberFormat.format(row.sessions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import StaffShell from '@site/src/components/StaffShell';
import { staffFetch } from '@site/src/lib/staffApi';
import { useStaffSession } from '@site/src/lib/useStaffSession';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
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

const COUNTRY_LABELS = {
  IL: 'ישראל',
  US: 'ארצות הברית',
  GB: 'בריטניה',
  DE: 'גרמניה',
  FR: 'צרפת',
  unknown: 'לא ידוע',
};

const ERRORS = {
  invalid_range: 'טווח התאריכים אינו תקין.',
  range_too_long: 'ניתן לבחור עד 366 ימים.',
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

function inclusiveDays(from, to) {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000) + 1;
}

export default function AnalyticsPage() {
  const history = useHistory();
  const location = useLocation();
  const { loading: sessionLoading, user } = useStaffSession();
  const initial = defaultRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [hideAdmins, setHideAdmins] = useState(true);
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

    const search = `?from=${from}&to=${to}&hideAdmins=${hideAdmins ? '1' : '0'}`;
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
  }, [ready, allowed, from, to, hideAdmins, history, location.pathname, location.search]);

  const preset = activePreset(from, to);
  const maxViews = report
    ? report.dailyPageViews.reduce((max, point) => Math.max(max, point.views), 0)
    : 0;

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
        <label className="staff-check">
          <input
            type="checkbox"
            checked={hideAdmins}
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
            <div
              className="staff-bars"
              role="img"
              aria-label={`צפיות יומיות, שיא ${numberFormat.format(maxViews)}`}
            >
              {report.dailyPageViews.map((point) => (
                <div
                  key={point.day}
                  className="staff-bars__col"
                  title={`${formatIso(point.day)}: ${numberFormat.format(point.views)}`}
                >
                  <div
                    className="staff-bars__bar"
                    style={{ height: maxViews && point.views ? `${(point.views / maxViews) * 100}%` : '0%' }}
                  />
                </div>
              ))}
            </div>
            <div className="staff-bars__axis">
              <span>{formatIso(report.from)}</span>
              <span>{formatIso(report.to)}</span>
            </div>
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
                      <tr key={row.page}>
                        <td>{row.page}</td>
                        <td>{numberFormat.format(row.views)}</td>
                        <td>{percentFormat.format(row.share)}</td>
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
                    <th>פעמים</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topClicks.map((row) => (
                    <tr key={`${row.label}-${row.elementId || ''}`}>
                      <td>
                        {row.label}
                        {row.elementId && row.elementId !== row.label && (
                          <span className="staff-muted"> · {row.elementId}</span>
                        )}
                      </td>
                      <td>{numberFormat.format(row.clicks)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h2>קהל</h2>
            <div className="staff-grid-3">
              <AudienceCard title="מכשיר" rows={report.audience.devices} labelFor={deviceLabel} />
              <AudienceCard title="מקור" rows={report.audience.referrers} labelFor={referrerLabel} />
              <AudienceCard title="מדינה" rows={report.audience.countries} labelFor={countryLabel} />
            </div>
          </section>
        </>
      )}
    </StaffShell>
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
  return COUNTRY_LABELS[key] || key;
}

function referrerLabel(key) {
  if (key === 'direct') return 'ישיר';
  return key;
}

function AudienceCard({ title, rows, labelFor }) {
  return (
    <div className="staff-card">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p>אין נתונים</p>
      ) : (
        <table className="staff-table">
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

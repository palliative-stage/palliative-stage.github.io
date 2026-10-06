import React, { useEffect } from 'react';
import Link from '@docusaurus/Link';
import StaffShell from '@site/src/components/StaffShell';
import entries from '@site/src/data/change-log.json';
import { useStaffSession } from '@site/src/lib/useStaffSession';

function formatIso(iso) {
  const [year, month, day] = String(iso).split('-');
  if (!year || !month || !day) return iso;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}

function AreaLink({ row }) {
  const label = (
    <>
      <span className="changelog-area__page">{row.area}</span>
      {row.section ? <span className="changelog-area__section">{row.section}</span> : null}
    </>
  );
  if (!row.href) return <span className="changelog-area">{label}</span>;
  return (
    <Link className="changelog-area" to={row.href}>
      {label}
    </Link>
  );
}

const rows = [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

export default function ChangelogPage() {
  const { loading: sessionLoading, user } = useStaffSession();
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

  return (
    <StaffShell title="יומן שינויים">
      <h1>יומן שינויים</h1>
      {!allowed ? (
        <p>טוען...</p>
      ) : rows.length === 0 ? (
        <p className="staff-muted">אין עדיין רשומות ביומן.</p>
      ) : (
        <div className="staff-card">
          <table className="staff-table">
            <thead>
              <tr>
                <th>תאריך</th>
                <th>תקציר</th>
                <th>אזור</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.date}-${row.href || row.area}-${row.summary}`}>
                  <td>
                    <bdi dir="ltr">{formatIso(row.date)}</bdi>
                  </td>
                  <td>{row.summary}</td>
                  <td>
                    <AreaLink row={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </StaffShell>
  );
}

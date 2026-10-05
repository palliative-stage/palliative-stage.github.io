import React, { useEffect } from 'react';
import StaffShell from '@site/src/components/StaffShell';
import entries from '@site/src/data/change-log.json';
import { useStaffSession } from '@site/src/lib/useStaffSession';

const dayFormat = new Intl.DateTimeFormat('he-IL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatIso(iso) {
  const [year, month, day] = String(iso).split('-').map(Number);
  if (!year || !month || !day) return iso;
  return dayFormat.format(new Date(Date.UTC(year, month - 1, day)));
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
                <tr key={`${row.date}-${row.area}-${row.summary}`}>
                  <td>{formatIso(row.date)}</td>
                  <td>{row.summary}</td>
                  <td>{row.area}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </StaffShell>
  );
}

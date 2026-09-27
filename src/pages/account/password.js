import React, { useEffect, useState } from 'react';
import StaffShell from '@site/src/components/StaffShell';
import { staffDestination, staffFetch } from '@site/src/lib/staffApi';
import { useStaffSession } from '@site/src/lib/useStaffSession';

const ERRORS = {
  invalid_credentials: 'הסיסמה הנוכחית שגויה.',
  too_many_attempts: 'יותר מדי ניסיונות. נסו שוב מאוחר יותר.',
  weak_password: 'הסיסמה החדשה חייבת להכיל לפחות 10 תווים.',
  same_password: 'בחרו סיסמה שונה מהסיסמה הנוכחית.',
  unavailable: 'לא ניתן לשמור כרגע. נסו שוב.',
};

export default function ChangePasswordPage() {
  const { loading, user } = useStaffSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      window.location.replace('/login');
      return;
    }
    if (!user.mustChangePassword) {
      window.location.replace(staffDestination(user));
    }
  }, [loading, user]);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות.');
      return;
    }
    setSubmitting(true);
    try {
      const { ok, data } = await staffFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!ok || !data || !data.user) {
        setError(ERRORS[(data && data.error) || 'unavailable'] || ERRORS.unavailable);
        setSubmitting(false);
        return;
      }
      window.location.assign(staffDestination(data.user));
    } catch {
      setError(ERRORS.unavailable);
      setSubmitting(false);
    }
  }

  if (loading || !user || !user.mustChangePassword) {
    return (
      <StaffShell title="החלפת סיסמה">
        <p>טוען...</p>
      </StaffShell>
    );
  }

  return (
    <StaffShell title="החלפת סיסמה">
      <form className="staff-card staff-login staff-form" onSubmit={onSubmit}>
        <h1>החלפת סיסמה</h1>
        <p>יש לבחור סיסמה חדשה לפני המשך השימוש.</p>
        <label>
          סיסמה נוכחית
          <input
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </label>
        <label>
          סיסמה חדשה
          <input
            type="password"
            name="newPassword"
            autoComplete="new-password"
            minLength={10}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </label>
        <label>
          אימות סיסמה חדשה
          <input
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            minLength={10}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </label>
        <p className="staff-muted">לפחות 10 תווים.</p>
        {error && (
          <p className="staff-error" role="alert">
            {error}
          </p>
        )}
        <button className="button button--primary" type="submit" disabled={submitting}>
          שמירת סיסמה
        </button>
      </form>
    </StaffShell>
  );
}

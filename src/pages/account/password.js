import React, { useEffect, useState } from 'react';
import EyeIcon from '@site/src/components/EyeIcon';
import StaffShell from '@site/src/components/StaffShell';
import { staffDestination, staffFetch } from '@site/src/lib/staffApi';
import { useStaffSession } from '@site/src/lib/useStaffSession';

function PasswordField({ label, name, autoComplete, value, onChange, minLength, shown, onToggle }) {
  return (
    <label>
      {label}
      <span className="staff-password">
        <input
          type={shown ? 'text' : 'password'}
          name={name}
          autoComplete={autoComplete}
          dir="ltr"
          minLength={minLength}
          value={value}
          onChange={onChange}
          required
        />
        <button
          type="button"
          className="staff-password__toggle"
          aria-label={shown ? 'הסתר סיסמה' : 'הצג סיסמה'}
          aria-pressed={shown}
          onClick={onToggle}
        >
          <EyeIcon off={shown} />
        </button>
      </span>
    </label>
  );
}

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
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const forced = Boolean(user && user.mustChangePassword);

  useEffect(() => {
    if (loading) return;
    if (!user) window.location.replace('/login');
  }, [loading, user]);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
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
      if (user.mustChangePassword) {
        window.location.assign(staffDestination(data.user));
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotice('הסיסמה עודכנה.');
      setSubmitting(false);
    } catch {
      setError(ERRORS.unavailable);
      setSubmitting(false);
    }
  }

  if (loading || !user) {
    return (
      <StaffShell title="שינוי סיסמה">
        <p>טוען...</p>
      </StaffShell>
    );
  }

  return (
    <StaffShell title="שינוי סיסמה">
      <form className="staff-card staff-login staff-form" onSubmit={onSubmit}>
        <h1>שינוי סיסמה</h1>
        {forced && <p>יש לבחור סיסמה חדשה לפני המשך השימוש.</p>}
        <PasswordField
          label="סיסמה נוכחית"
          name="currentPassword"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          shown={showCurrent}
          onToggle={() => setShowCurrent((visible) => !visible)}
        />
        <PasswordField
          label="סיסמה חדשה"
          name="newPassword"
          autoComplete="new-password"
          minLength={10}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          shown={showNew}
          onToggle={() => setShowNew((visible) => !visible)}
        />
        <PasswordField
          label="אימות סיסמה חדשה"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={10}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          shown={showConfirm}
          onToggle={() => setShowConfirm((visible) => !visible)}
        />
        <p className="staff-muted">לפחות 10 תווים.</p>
        {notice && <p className="staff-ok">{notice}</p>}
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

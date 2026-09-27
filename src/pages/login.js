import React, { useEffect, useState } from 'react';
import StaffShell from '@site/src/components/StaffShell';
import { staffDestination, staffFetch } from '@site/src/lib/staffApi';
import { useStaffSession } from '@site/src/lib/useStaffSession';

const ERRORS = {
  invalid_credentials: 'האימייל או הסיסמה שגויים.',
  too_many_attempts: 'יותר מדי ניסיונות. נסו שוב מאוחר יותר.',
  unavailable: 'לא ניתן להתחבר כרגע. נסו שוב.',
};

export default function LoginPage() {
  const { loading, user } = useStaffSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      window.location.replace(staffDestination(user));
    }
  }, [loading, user]);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { ok, data } = await staffFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
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

  if (loading || user) {
    return (
      <StaffShell title="כניסה">
        <p>טוען...</p>
      </StaffShell>
    );
  }

  return (
    <StaffShell title="כניסה">
      <form className="staff-card staff-login staff-form" onSubmit={onSubmit}>
        <h1>כניסה</h1>
        <label>
          אימייל
          <input
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          סיסמה
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error && (
          <p className="staff-error" role="alert">
            {error}
          </p>
        )}
        <button className="button button--primary" type="submit" disabled={submitting}>
          כניסה
        </button>
      </form>
    </StaffShell>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { staffFetch } from '@site/src/lib/staffApi';

const ERRORS = {
  invalid_credentials: 'האימייל או הסיסמה שגויים.',
  too_many_attempts: 'יותר מדי ניסיונות. נסו שוב מאוחר יותר.',
  unavailable: 'לא ניתן להתחבר כרגע. נסו שוב.',
};

export default function LoginDialog({ onClose, onSuccess }) {
  const emailRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (emailRef.current) emailRef.current.focus();
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

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
      onSuccess(data.user);
    } catch {
      setError(ERRORS.unavailable);
      setSubmitting(false);
    }
  }

  return (
    <div
      className="staff-dialog__backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className="staff-card staff-dialog staff-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-login-title"
        dir="rtl"
        lang="he"
        onSubmit={onSubmit}
      >
        <h2 id="staff-login-title">כניסה</h2>
        <label>
          אימייל
          <input
            ref={emailRef}
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
    </div>
  );
}

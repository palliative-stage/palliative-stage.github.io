import React, { useEffect, useRef, useState } from 'react';
import { staffFetch } from '@site/src/lib/staffApi';

const ERRORS = {
  invalid_credentials: 'The email or password is incorrect.',
  too_many_attempts: 'Too many attempts. Try again later.',
  unavailable: 'Unable to sign in right now. Try again.',
};

function EyeIcon({ off }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
      {off && (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          d="M4 4l16 16"
        />
      )}
    </svg>
  );
}

export default function LoginDialog({ onClose, onSuccess }) {
  const emailRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        className="staff-card staff-dialog staff-dialog--en staff-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-login-title"
        dir="ltr"
        lang="en"
        onSubmit={onSubmit}
      >
        <div className="staff-dialog__header">
          <h2 id="staff-login-title">Log in</h2>
          <button type="button" className="staff-dialog__close" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          </button>
        </div>
        <label>
          Email
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
          Password
          <span className="staff-password">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="staff-password__toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              <EyeIcon off={showPassword} />
            </button>
          </span>
        </label>
        {error && (
          <p className="staff-error" role="alert">
            {error}
          </p>
        )}
        <button className="button button--primary" type="submit" disabled={submitting}>
          Log in
        </button>
      </form>
    </div>
  );
}

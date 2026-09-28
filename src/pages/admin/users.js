import React, { useEffect, useState } from 'react';
import EyeIcon from '@site/src/components/EyeIcon';
import StaffShell from '@site/src/components/StaffShell';
import { staffFetch } from '@site/src/lib/staffApi';
import { useStaffSession } from '@site/src/lib/useStaffSession';

const ROLE_LABELS = {
  super_admin: 'Super admin',
  admin: 'Admin',
  user: 'User',
};

const ERRORS = {
  invalid_email: 'Enter a valid email address.',
  invalid_role: 'Choose Admin or User.',
  weak_password: 'Use at least 10 characters.',
  email_taken: 'That email is already in use.',
  forbidden: 'Super-admin passwords can only be changed by signing in.',
  not_found: 'User not found.',
  unauthorized: 'Your session has expired. Sign in again.',
  password_change_required: 'Change your password before continuing.',
  unavailable: 'The server is unavailable.',
};

function messageFor(data) {
  return ERRORS[(data && data.error) || 'unavailable'] || ERRORS.unavailable;
}

export default function UsersPage() {
  const { loading, user } = useStaffSession();
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetId, setResetId] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');

  const allowed = Boolean(user && user.role === 'super_admin' && !user.mustChangePassword);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      window.location.replace('/login');
      return;
    }
    if (user.mustChangePassword) {
      window.location.replace('/account/password');
      return;
    }
    if (user.role !== 'super_admin') {
      window.location.replace(user.role === 'admin' ? '/admin/analytics' : '/');
    }
  }, [loading, user]);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    staffFetch('/api/admin/users')
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (ok && data) {
          setUsers(data.users || []);
          return;
        }
        setError(messageFor(data));
      })
      .catch(() => {
        if (!cancelled) setError(ERRORS.unavailable);
      });
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  async function reload() {
    const { ok, data } = await staffFetch('/api/admin/users');
    if (ok && data) setUsers(data.users || []);
  }

  async function onCreate(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const { ok, data } = await staffFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ email, role, password }),
      });
      if (!ok) {
        setError(messageFor(data));
        setSubmitting(false);
        return;
      }
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setRole('admin');
      setNotice('User added. They must change this password when they sign in.');
      await reload();
    } catch {
      setError(ERRORS.unavailable);
    }
    setSubmitting(false);
  }

  async function onReset(event, userId) {
    event.preventDefault();
    setResetError('');
    setNotice('');
    try {
      const { ok, data } = await staffFetch('/api/admin/users/reset-password', {
        method: 'POST',
        body: JSON.stringify({ userId, password: resetPassword }),
      });
      if (!ok) {
        setResetError(messageFor(data));
        return;
      }
      setResetId(null);
      setResetPassword('');
      setNotice('Initial password updated. They must change it the next time they sign in.');
      await reload();
    } catch {
      setResetError(ERRORS.unavailable);
    }
  }

  if (!allowed) {
    return (
      <StaffShell title="Users" dir="ltr" lang="en">
        <p>Loading...</p>
      </StaffShell>
    );
  }

  return (
    <StaffShell title="Users" dir="ltr" lang="en">
      <h1>Users</h1>
      <p className="staff-muted">
        Add an admin or a regular user and set their initial password. They must change it the next
        time they sign in. Regular users can sign in, but they do not have staff screens yet.
      </p>

      <form className="staff-card staff-form staff-create" onSubmit={onCreate}>
        <h2>Add user</h2>
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="off"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Role
          <select name="role" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </label>
        <label>
          Initial password
          <span className="staff-password">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              minLength={10}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="staff-password__toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((shown) => !shown)}
            >
              <EyeIcon off={showPassword} />
            </button>
          </span>
        </label>
        <p className="staff-muted">At least 10 characters.</p>
        {error && (
          <p className="staff-error" role="alert">
            {error}
          </p>
        )}
        {notice && <p className="staff-ok">{notice}</p>}
        <button className="button button--primary" type="submit" disabled={submitting}>
          Add user
        </button>
      </form>

      <div className="staff-card">
        <h2>Accounts</h2>
        <table className="staff-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Password change</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((account) => (
              <tr key={account.userId}>
                <td>{account.email}</td>
                <td>{ROLE_LABELS[account.role] || account.role}</td>
                <td>{account.mustChangePassword ? 'Required' : 'Done'}</td>
                <td>
                  {account.role === 'super_admin' ? (
                    <span className="staff-muted">Sign in to change</span>
                  ) : resetId === account.userId ? (
                    <form className="staff-reset" onSubmit={(event) => onReset(event, account.userId)}>
                      <input
                        type="password"
                        aria-label={`New initial password for ${account.email}`}
                        autoComplete="new-password"
                        minLength={10}
                        value={resetPassword}
                        onChange={(event) => setResetPassword(event.target.value)}
                        required
                      />
                      <button className="button button--primary button--sm" type="submit">
                        Save
                      </button>
                      <button
                        className="button button--secondary button--sm"
                        type="button"
                        onClick={() => {
                          setResetId(null);
                          setResetPassword('');
                          setResetError('');
                        }}
                      >
                        Cancel
                      </button>
                      {resetError && <span className="staff-error">{resetError}</span>}
                    </form>
                  ) : (
                    <button
                      className="button button--secondary button--sm"
                      type="button"
                      onClick={() => {
                        setResetId(account.userId);
                        setResetPassword('');
                        setResetError('');
                        setNotice('');
                      }}
                    >
                      Set initial password
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
}

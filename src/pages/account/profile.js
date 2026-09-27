import React, { useEffect, useState } from 'react';
import StaffShell from '@site/src/components/StaffShell';
import { publishStaffUser, staffFetch } from '@site/src/lib/staffApi';
import { useStaffSession } from '@site/src/lib/useStaffSession';

const OCCUPATIONS = [
  { value: 'doctor', label: 'רופא/ה' },
  { value: 'nurse', label: 'אח/ות' },
  { value: 'social_worker', label: 'עובד/ת סוציאלי/ת' },
  { value: 'other', label: 'אחר' },
];

const ERRORS = {
  invalid_name: 'יש למלא שם פרטי ושם משפחה.',
  invalid_occupation: 'יש לבחור עיסוק.',
  password_change_required: 'יש להחליף סיסמה לפני המשך.',
  unauthorized: 'ההתחברות פגה. היכנסו שוב.',
  unavailable: 'לא ניתן לשמור כרגע. נסו שוב.',
};

export default function ProfilePage() {
  const { loading, user } = useStaffSession();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      window.location.replace('/login');
      return;
    }
    if (user.mustChangePassword) {
      window.location.replace('/account/password');
    }
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setOccupation(user.occupation || '');
  }, [user]);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const { ok, data } = await staffFetch('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ firstName, lastName, occupation }),
      });
      if (!ok || !data || !data.user) {
        setError(ERRORS[(data && data.error) || 'unavailable'] || ERRORS.unavailable);
        setSubmitting(false);
        return;
      }
      publishStaffUser(data.user);
      setNotice('הפרופיל נשמר.');
    } catch {
      setError(ERRORS.unavailable);
    }
    setSubmitting(false);
  }

  if (loading || !user || user.mustChangePassword) {
    return (
      <StaffShell title="עדכון פרופיל">
        <p>טוען...</p>
      </StaffShell>
    );
  }

  return (
    <StaffShell title="עדכון פרופיל">
      <form className="staff-card staff-login staff-form" onSubmit={onSubmit}>
        <h1>עדכון פרופיל</h1>
        <label>
          שם פרטי
          <input
            type="text"
            name="firstName"
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
            maxLength={80}
          />
        </label>
        <label>
          שם משפחה
          <input
            type="text"
            name="lastName"
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
            maxLength={80}
          />
        </label>
        <label>
          עיסוק
          <select
            name="occupation"
            value={occupation}
            onChange={(event) => setOccupation(event.target.value)}
            required
          >
            <option value="">בחרו עיסוק</option>
            {OCCUPATIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {notice && <p className="staff-ok">{notice}</p>}
        {error && (
          <p className="staff-error" role="alert">
            {error}
          </p>
        )}
        <button className="button button--primary" type="submit" disabled={submitting}>
          שמירה
        </button>
      </form>
    </StaffShell>
  );
}

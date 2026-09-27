import { useEffect, useState } from 'react';
import { staffFetch } from './staffApi';

export function useStaffSession() {
  const [state, setState] = useState({ loading: true, user: null });

  useEffect(() => {
    let cancelled = false;
    staffFetch('/api/auth/me')
      .then(({ ok, data }) => {
        if (cancelled) return;
        setState({ loading: false, user: ok && data && data.user ? data.user : null });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, user: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

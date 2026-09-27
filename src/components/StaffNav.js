import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import { staffFetch } from '@site/src/lib/staffApi';

export default function StaffNav() {
  const location = useLocation();
  const [user, setUser] = useState(undefined);
  const [slot, setSlot] = useState(null);

  useEffect(() => {
    let cancelled = false;
    staffFetch('/api/auth/me')
      .then(({ data }) => {
        if (!cancelled) setUser(data && data.user ? data.user : null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  useEffect(() => {
    const find = () => {
      const items = document.querySelector('.navbar__inner > .navbar__items:not(.navbar__items--right)');
      if (!items) return null;
      let slot = items.querySelector(':scope > .staff-nav-slot');
      if (!slot) {
        slot = document.createElement('div');
        slot.className = 'staff-nav-slot';
        const brand = items.querySelector('.navbar__brand');
        if (brand) brand.insertAdjacentElement('afterend', slot);
        else items.appendChild(slot);
      }
      return slot;
    };

    const attach = () => {
      setSlot((current) => {
        const next = find();
        return current === next ? current : next;
      });
    };

    attach();
    const timer = window.setTimeout(attach, 0);
    const navbar = document.querySelector('.navbar');
    const observer = navbar ? new MutationObserver(attach) : null;
    if (navbar && observer) observer.observe(navbar, { childList: true });
    window.addEventListener('resize', attach);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', attach);
      if (observer) observer.disconnect();
    };
  }, [location.pathname]);

  if (!slot || user === undefined) return null;

  const showTools = Boolean(user && !user.mustChangePassword);
  const showAnalytics = showTools && (user.role === 'admin' || user.role === 'super_admin');
  const showUsers = showTools && user.role === 'super_admin';

  async function logout() {
    await staffFetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  return createPortal(
    <div className="staff-nav">
      {!user && (
        <Link className="navbar__link" to="/login">
          כניסה
        </Link>
      )}
      {showAnalytics && (
        <Link className="navbar__link" to="/admin/analytics">
          אנליטיקה
        </Link>
      )}
      {showUsers && (
        <Link className="navbar__link" to="/admin/users">
          Users
        </Link>
      )}
      {user && (
        <button type="button" className="navbar__link staff-nav__button" onClick={logout}>
          יציאה
        </button>
      )}
    </div>,
    slot
  );
}

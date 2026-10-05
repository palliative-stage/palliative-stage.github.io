import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import LoginDialog from '@site/src/components/LoginDialog';
import {
  STAFF_USER_EVENT,
  needsProfile,
  staffDestination,
  staffFetch,
} from '@site/src/lib/staffApi';

function staffInitials(user) {
  const first = Array.from(String(user.firstName || '').trim());
  const last = Array.from(String(user.lastName || '').trim());
  if (first.length && last.length) return first[0] + last[0];
  const fromEmail = Array.from(String(user.email || '')).slice(0, 2).join('');
  return fromEmail || '?';
}

export default function StaffNav() {
  const location = useLocation();
  const accountRef = useRef(null);
  const loginButtonRef = useRef(null);
  const [user, setUser] = useState(undefined);
  const [slot, setSlot] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMenuOpen(false);
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
    const onUser = (event) => {
      setUser(event.detail || null);
    };
    window.addEventListener(STAFF_USER_EVENT, onUser);
    return () => window.removeEventListener(STAFF_USER_EVENT, onUser);
  }, []);

  useEffect(() => {
    const find = () => {
      const search = document.querySelector('.navbar__inner .navbar__search');
      const items = document.querySelector('.navbar__inner > .navbar__items:not(.navbar__items--right)');
      const host = search ? search.parentElement : items;
      if (!host) return null;

      let next = document.querySelector('.navbar__inner .staff-nav-slot');
      if (!next) {
        next = document.createElement('div');
        next.className = 'staff-nav-slot';
      }

      if (search) {
        if (next.previousElementSibling !== search) {
          search.insertAdjacentElement('afterend', next);
        }
      } else {
        const brand = items && items.querySelector('.navbar__brand');
        if (next.parentElement !== host) {
          if (brand) brand.insertAdjacentElement('afterend', next);
          else host.appendChild(next);
        }
      }
      return next;
    };

    const attach = () => {
      setSlot((current) => {
        const next = find();
        return current === next ? current : next;
      });
    };

    attach();
    const timer = window.setTimeout(attach, 0);
    const root = document.querySelector('#__docusaurus') || document.body;
    const observer = new MutationObserver(attach);
    observer.observe(root, { childList: true, subtree: true });
    window.addEventListener('resize', attach);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', attach);
      observer.disconnect();
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointer = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const closeLogin = useCallback(() => {
    setLoginOpen(false);
    window.setTimeout(() => {
      if (loginButtonRef.current) loginButtonRef.current.focus();
    }, 0);
  }, []);

  const onLogin = useCallback((nextUser) => {
    setLoginOpen(false);
    if (nextUser && (nextUser.mustChangePassword || needsProfile(nextUser))) {
      window.location.assign(staffDestination(nextUser));
      return;
    }
    setUser(nextUser);
  }, []);

  if (!slot || user === undefined) return null;

  const showTools = Boolean(user && !user.mustChangePassword);
  const showAnalytics = showTools && (user.role === 'admin' || user.role === 'super_admin');
  const showUsers = showTools && user.role === 'super_admin';

  async function logout() {
    await staffFetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  return (
    <>
      {createPortal(
        <div className="staff-nav">
          {!user && (
            <button
              ref={loginButtonRef}
              type="button"
              className="staff-nav__login"
              onClick={() => setLoginOpen(true)}
            >
              כניסה
            </button>
          )}
          {user && (
            <div className="staff-nav__account" ref={accountRef}>
              <button
                type="button"
                className="staff-nav__avatar"
                aria-label="הפרופיל שלי"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {staffInitials(user)}
              </button>
              {menuOpen && (
                <ul className="staff-nav__menu" role="menu">
                  <li role="none">
                    <Link role="menuitem" to="/account/profile" onClick={() => setMenuOpen(false)}>
                      עדכון פרופיל
                    </Link>
                  </li>
                  <li role="none">
                    <Link role="menuitem" to="/account/password" onClick={() => setMenuOpen(false)}>
                      שינוי סיסמה
                    </Link>
                  </li>
                  {showAnalytics && (
                    <li role="none">
                      <Link role="menuitem" to="/admin/analytics" onClick={() => setMenuOpen(false)}>
                        אנליטיקה
                      </Link>
                    </li>
                  )}
                  {showAnalytics && (
                    <li role="none">
                      <Link role="menuitem" to="/admin/changelog" onClick={() => setMenuOpen(false)}>
                        יומן שינויים
                      </Link>
                    </li>
                  )}
                  {showUsers && (
                    <li role="none">
                      <Link role="menuitem" to="/admin/users" onClick={() => setMenuOpen(false)}>
                        משתמשים
                      </Link>
                    </li>
                  )}
                  <li role="none">
                    <button type="button" role="menuitem" onClick={logout}>
                      יציאה
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>,
        slot
      )}
      {loginOpen &&
        createPortal(<LoginDialog onClose={closeLogin} onSuccess={onLogin} />, document.body)}
    </>
  );
}

import React, {useLayoutEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

const PORTAL_OPEN_CLASS = 'mobile-toc-portal-open';

function getAnchorBottom(anchorEl) {
  if (!anchorEl) {
    return 0;
  }
  return Math.round(anchorEl.getBoundingClientRect().bottom);
}

function lockBodyScroll() {
  const scrollY = window.scrollY;
  const {body} = document;

  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
  body.style.overflow = 'hidden';
  document.documentElement.classList.add(PORTAL_OPEN_CLASS);

  return () => {
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    body.style.overflow = '';
    document.documentElement.classList.remove(PORTAL_OPEN_CLASS);
    window.scrollTo(0, scrollY);
  };
}

export default function MobileTocPortal({anchorRef, children}) {
  const [top, setTop] = useState(0);

  useLayoutEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) {
      return undefined;
    }

    return lockBodyScroll();
  }, []);

  useLayoutEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) {
      return undefined;
    }

    const updatePosition = () => {
      setTop(getAnchorBottom(anchorRef.current));
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [anchorRef]);

  if (!ExecutionEnvironment.canUseDOM) {
    return null;
  }

  return createPortal(
    <div
      className="mobile-toc-portal__sheet"
      style={{top: `${top}px`, maxHeight: `calc(100vh - ${top}px)`}}>
      {children}
    </div>,
    document.body,
  );
}

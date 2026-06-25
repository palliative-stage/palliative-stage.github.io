import React, {useLayoutEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

function getAnchorTop(anchorEl) {
  if (!anchorEl) {
    return 0;
  }
  return Math.round(anchorEl.getBoundingClientRect().bottom);
}

export default function MobileTocPortal({anchorRef, onClose, children}) {
  const [top, setTop] = useState(0);

  useLayoutEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) {
      return undefined;
    }

    const updatePosition = () => {
      setTop(getAnchorTop(anchorRef.current));
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef]);

  if (!ExecutionEnvironment.canUseDOM) {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        className="mobile-toc-portal__backdrop"
        aria-label="סגור ניווט בדף זה"
        onClick={onClose}
      />
      <div
        className="mobile-toc-portal__sheet"
        style={{top: `${top}px`, maxHeight: `calc(100vh - ${top}px)`}}>
        {children}
      </div>
    </>,
    document.body,
  );
}

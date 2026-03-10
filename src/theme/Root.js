import React, { useEffect, useRef } from 'react';
import { useLocation } from '@docusaurus/router';
import { trackPageView, initClickTracking, getPageName } from '@site/src/lib/analytics';

export default function Root({ children }) {
  const location = useLocation();
  const prevPathRef = useRef(null);

  useEffect(() => {
    initClickTracking();
  }, []);

  useEffect(() => {
    const pathname = location?.pathname || (typeof window !== 'undefined' ? window.location.pathname : null);
    if (pathname && pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      trackPageView(getPageName());
    }
  }, [location?.pathname]);

  return <>{children}</>;
}

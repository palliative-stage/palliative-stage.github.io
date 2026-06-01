import React, { useEffect, useRef } from 'react';
import NotFound from '@theme-original/NotFound';
import { reportError } from '@site/src/lib/errors';

export default function NotFoundWrapper(props) {
  const reportedRef = useRef(false);

  useEffect(() => {
    if (reportedRef.current || typeof window === 'undefined') return;
    reportedRef.current = true;
    reportError({
      errorType: 'page_not_found',
      failedUrl: window.location.href,
    });
  }, []);

  return <NotFound {...props} />;
}

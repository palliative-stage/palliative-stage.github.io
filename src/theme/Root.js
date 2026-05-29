import React, { useEffect, useRef } from 'react';
import { useLocation } from '@docusaurus/router';
import { trackPageView, initClickTracking, getPageName, trackSearch } from '@site/src/lib/analytics';

const SEARCH_HIGHLIGHT_PARAM = '_highlight';

export default function Root({ children }) {
  const location = useLocation();
  const prevPathRef = useRef(null);
  const prevSearchTrackRef = useRef(null);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(location.search);
    const isSearchPage = /\/search$/.test(location.pathname);
    const queryFromUrl = params.get('q');
    const hasHighlight = params.has(SEARCH_HIGHLIGHT_PARAM);

    let query = queryFromUrl;
    let trackKey = null;
    let extra = {};

    if (isSearchPage && queryFromUrl) {
      trackKey = `search-page:${queryFromUrl}`;
      extra = { action: 'search_page' };
    } else if (hasHighlight) {
      const input = document.querySelector('.navbar__search-input');
      query = input?.value?.trim() || queryFromUrl;
      if (query) {
        trackKey = `result:${location.pathname}${location.hash}:${query}`;
        extra = { action: 'result_click' };
      }
    }

    if (!trackKey || trackKey === prevSearchTrackRef.current) return;
    prevSearchTrackRef.current = trackKey;
    trackSearch('navbar', query, extra);
  }, [location.pathname, location.search, location.hash]);

  return <>{children}</>;
}

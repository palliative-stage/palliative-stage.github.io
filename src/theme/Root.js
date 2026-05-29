import React, { useEffect, useRef } from 'react';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { trackPageView, initClickTracking, getPageName, trackSearch } from '@site/src/lib/analytics';
import { cleanupPageTitleSearchHighlights } from '@site/src/lib/searchHighlightCleanup';
import { useHistory } from '@docusaurus/router';

const SEARCH_HIGHLIGHT_PARAM = '_highlight';
const RTL_SEARCH_LABEL = 'חיפוש';

export default function Root({ children }) {
  const location = useLocation();
  const history = useHistory();
  const { i18n } = useDocusaurusContext();
  const prevPathRef = useRef(null);
  const prevSearchTrackRef = useRef(null);

  useEffect(() => {
    initClickTracking();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined' || i18n.currentLocale !== 'he') {
      return undefined;
    }

    const labelSearchInput = () => {
      const input = document.querySelector('.navbar__search-input');
      if (!input || input.getAttribute('data-rtl-search-label') === '1') {
        return;
      }
      input.setAttribute('data-rtl-search-label', '1');
      if (input.getAttribute('aria-label') === 'Search' || !input.getAttribute('aria-label')) {
        input.setAttribute('aria-label', RTL_SEARCH_LABEL);
      }
    };

    labelSearchInput();
    const timer = window.setTimeout(labelSearchInput, 500);

    return () => window.clearTimeout(timer);
  }, [i18n.currentLocale]);

  useEffect(() => {
    cleanupPageTitleSearchHighlights(location, history);
  }, [location.pathname, location.search, location.hash, history]);

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

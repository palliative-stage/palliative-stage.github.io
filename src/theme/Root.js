import React, { useEffect, useRef } from 'react';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { Analytics } from '@vercel/analytics/react';
import { trackPageView, initClickTracking, getPageName, trackSearch } from '@site/src/lib/analytics';
import { initLinkErrorChecking } from '@site/src/lib/errors';
import { cleanupPageTitleSearchHighlights } from '@site/src/lib/searchHighlightCleanup';
import { useHistory } from '@docusaurus/router';

const SEARCH_HIGHLIGHT_PARAM = '_highlight';
const RTL_SEARCH_LABEL = 'חיפוש';
const WHATSAPP_CONTACT_URL = 'https://wa.me/972544787720';

export default function Root({ children }) {
  const location = useLocation();
  const history = useHistory();
  const { i18n } = useDocusaurusContext();
  const prevPathRef = useRef(null);
  const prevSearchTrackRef = useRef(null);

  useEffect(() => {
    initClickTracking();
    initLinkErrorChecking();
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

  return (
    <>
      {process.env.NODE_ENV === 'production' && (
        <Analytics mode="production" debug={false} />
      )}
      {children}
      <a
        className="whatsapp-contact-button"
        href={WHATSAPP_CONTACT_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="מצאת טעות? רוצה להציע שיפור? כתבו לנו ב-WhatsApp"
        data-analytics-id="whatsapp-contact"
        data-analytics-type="contact"
        data-analytics-text="מצאת טעות? רוצה להציע שיפור?"
      >
        <bdi className="whatsapp-contact-button__prompt" dir="rtl">
          {'מצאת טעות?\u200F'}
        </bdi>
        <span className="whatsapp-contact-button__action">
          <bdi dir="rtl">הציעו שיפור</bdi>
          <span className="whatsapp-contact-button__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M12.04 2.5A9.43 9.43 0 0 0 3.8 16.52L2.5 21.5l5.12-1.28a9.4 9.4 0 0 0 4.42 1.12h.01a9.42 9.42 0 0 0-.01-18.84Zm0 16.95h-.01a7.55 7.55 0 0 1-3.85-1.05l-.28-.17-3.03.76.79-2.94-.19-.3a7.55 7.55 0 1 1 6.57 3.7Zm4.13-5.65c-.23-.11-1.34-.66-1.55-.74-.21-.08-.36-.11-.51.11-.15.23-.58.74-.72.89-.13.15-.26.17-.49.06-.23-.11-.96-.35-1.83-1.13-.68-.6-1.13-1.35-1.27-1.58-.13-.23-.01-.35.1-.46.1-.1.23-.26.34-.39.11-.13.15-.23.23-.38.08-.15.04-.28-.02-.39-.06-.11-.51-1.24-.7-1.7-.18-.44-.37-.38-.51-.39h-.44c-.15 0-.39.06-.6.28-.21.23-.79.77-.79 1.88s.81 2.18.92 2.33c.11.15 1.59 2.42 3.86 3.4.54.23.96.37 1.29.48.54.17 1.04.15 1.43.09.44-.07 1.34-.55 1.53-1.08.19-.53.19-.98.13-1.08-.06-.1-.21-.16-.44-.27Z" />
            </svg>
          </span>
        </span>
      </a>
    </>
  );
}

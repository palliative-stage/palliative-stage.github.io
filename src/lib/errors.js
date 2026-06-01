/**
 * Client-side error reporter.
 * POSTs to /api/errors (Vercel serverless). Set customFields.errorsApiBase in
 * docusaurus.config.js if the API is hosted on a different origin than the site.
 */

import {
  generateId,
  getOrCreateSessionId,
  getOrCreateUserId,
  getReferrerDomain,
} from '@site/src/lib/analytics';

const ERRORS_CONFIG = {
  enabled: true,
  endpoint: '/api/errors',
};

function getEndpoint() {
  if (typeof window === 'undefined') return null;
  const base =
    window.__ERRORS_API_BASE__ ||
    (typeof globalThis !== 'undefined' && globalThis.__ERRORS_API_BASE__) ||
    null;
  if (base) {
    return `${String(base).replace(/\/$/, '')}/api/errors`;
  }
  if (ERRORS_CONFIG.endpoint.startsWith('http')) {
    return ERRORS_CONFIG.endpoint;
  }
  return `${window.location.origin}${ERRORS_CONFIG.endpoint}`;
}

function buildPayload(props = {}) {
  return {
    error_id: generateId(),
    occurred_at: new Date().toISOString(),
    page_url: typeof window !== 'undefined' ? window.location.href : undefined,
    page_title: typeof document !== 'undefined' ? document.title : undefined,
    referrer_domain: getReferrerDomain(),
    session_id: getOrCreateSessionId(),
    user_pseudo_id: getOrCreateUserId(),
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    viewport_width: typeof window !== 'undefined' ? window.innerWidth : undefined,
    viewport_height: typeof window !== 'undefined' ? window.innerHeight : undefined,
    ...props,
  };
}

function sendPayload(payload) {
  if (!ERRORS_CONFIG.enabled) return;

  const url = getEndpoint();
  if (!url) return;

  const body = JSON.stringify(payload);

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon(url, blob)) {
      return;
    }
  }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}

function reportError({ errorType, failedUrl, statusCode, linkText, extra = {} }) {
  try {
    const payload = buildPayload({
      error_type: errorType,
      failed_url: failedUrl,
      status_code: statusCode != null ? statusCode : undefined,
      link_text: linkText != null ? String(linkText).slice(0, 255) : undefined,
      ...extra,
    });
    sendPayload(payload);
  } catch (_) {}
}

function checkLinkOnClick(anchor) {
  try {
    if (!anchor || anchor.tagName !== 'A') return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    const linkText = (anchor.innerText || anchor.textContent || '').trim().slice(0, 255);
    const payload = buildPayload({
      action: 'check_url',
      failed_url: anchor.href,
      link_text: linkText || undefined,
    });
    sendPayload(payload);
  } catch (_) {}
}

function shouldCheckLink(anchor) {
  if (!anchor || anchor.tagName !== 'A') return false;

  const href = anchor.getAttribute('href');
  if (!href) return false;
  if (href.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(href)) return false;

  try {
    const url = new URL(anchor.href, window.location.origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

    const isSameOrigin = url.origin === window.location.origin;
    if (!isSameOrigin) return true;

    const pathname = url.pathname;
    const extMatch = pathname.match(/\.([a-z0-9]+)$/i);
    if (extMatch) {
      const ext = extMatch[1].toLowerCase();
      if (ext === 'html' || ext === 'htm') return false;
      return true;
    }

    if (
      pathname.startsWith('/pdf/') ||
      pathname.startsWith('/assets/') ||
      pathname.startsWith('/img/')
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

function initLinkErrorChecking() {
  if (typeof document === 'undefined') return;

  document.addEventListener(
    'click',
    (e) => {
      const anchor = e.target.closest('a[href]');
      if (!anchor || !shouldCheckLink(anchor)) return;
      checkLinkOnClick(anchor);
    },
    { passive: true, capture: true }
  );
}

export {
  reportError,
  checkLinkOnClick,
  initLinkErrorChecking,
  shouldCheckLink,
};

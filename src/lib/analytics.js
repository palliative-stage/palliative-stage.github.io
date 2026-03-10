/**
 * Privacy-friendly analytics client.
 * Tracks page views and clicks via sendBeacon/fetch to /api/analytics.
 */

const ANALYTICS_CONFIG = {
  enabled: true,
  endpoint: '/api/analytics',
};

const SESSION_KEY = 'analytics_session_id';
const USER_KEY = 'analytics_user_pseudo_id';

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateId();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return generateId();
  }
}

function getOrCreateUserId() {
  try {
    let id = localStorage.getItem(USER_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(USER_KEY, id);
    }
    return id;
  } catch {
    return generateId();
  }
}

function parseUtmParams() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
  };
}

function getReferrerDomain() {
  if (typeof document === 'undefined' || !document.referrer) return undefined;
  try {
    const url = new URL(document.referrer);
    return url.hostname || undefined;
  } catch {
    return undefined;
  }
}

function getPageName() {
  if (typeof document === 'undefined' || !document.title) return '';
  const title = document.title.trim();
  const sep = ' | ';
  const idx = title.indexOf(sep);
  const pageName = idx >= 0 ? title.slice(0, idx).trim() : title;
  return pageName.slice(0, 255) || title.slice(0, 255);
}

function buildPayload(eventType, props = {}) {
  const sessionId = getOrCreateSessionId();
  const userId = getOrCreateUserId();
  const utm = parseUtmParams();

  const payload = {
    event_id: generateId(),
    event_type: eventType,
    occurred_at: new Date().toISOString(),
    page_url: typeof window !== 'undefined' ? window.location.href : undefined,
    page_title: typeof document !== 'undefined' ? document.title : undefined,
    referrer_domain: getReferrerDomain(),
    ...utm,
    session_id: sessionId,
    user_pseudo_id: userId,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    viewport_width: typeof window !== 'undefined' ? window.innerWidth : undefined,
    viewport_height: typeof window !== 'undefined' ? window.innerHeight : undefined,
    ...props,
  };

  return payload;
}

function sendEvent(payload) {
  if (!ANALYTICS_CONFIG.enabled || !ANALYTICS_CONFIG.endpoint) return;

  const url = ANALYTICS_CONFIG.endpoint.startsWith('http')
    ? ANALYTICS_CONFIG.endpoint
    : `${window.location.origin}${ANALYTICS_CONFIG.endpoint}`;

  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
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

function trackEvent(eventType, props = {}) {
  try {
    const payload = buildPayload(eventType, props);
    sendEvent(payload);
  } catch (_) {}
}

function trackPageView(pageName) {
  const name = pageName != null ? String(pageName).slice(0, 255) : getPageName();
  trackEvent('page_view', {
    entry_id: name || undefined,
    section: name ? 'doc' : 'landing',
    page_url: typeof window !== 'undefined' ? window.location.href : undefined,
  });
}

function sanitizeSearchQuery(raw) {
  if (typeof raw !== 'string') return '';
  let s = raw.trim().slice(0, 80);
  s = s.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted_email]');
  s = s.replace(/[\d\s+()-]{7,}/g, '[redacted_number]');
  return s;
}

function trackSearch(location, rawQuery, extra = {}) {
  const search_query = sanitizeSearchQuery(rawQuery);
  trackEvent('search', { search_location: location, search_query, ...extra });
}

function initClickTracking() {
  if (typeof document === 'undefined') return;

  document.addEventListener(
    'click',
    (e) => {
      const linkOrButton = e.target.closest('a, button');
      if (!linkOrButton) return;

      const hasAnalyticsAttr = linkOrButton.hasAttribute('data-analytics-id') || linkOrButton.hasAttribute('data-tracking-name');
      const isExternalLink = linkOrButton.tagName === 'A' && linkOrButton.href && linkOrButton.href.startsWith('http');

      if (!hasAnalyticsAttr && !isExternalLink) return;

      let elementId;
      let elementType;
      let section;

      if (hasAnalyticsAttr) {
        elementId = linkOrButton.getAttribute('data-analytics-id') || linkOrButton.getAttribute('data-tracking-name');
        elementType = linkOrButton.getAttribute('data-analytics-type') || linkOrButton.getAttribute('data-tracking-type') || 'link';
        section = linkOrButton.getAttribute('data-analytics-section') || linkOrButton.getAttribute('data-tracking-section');
      } else {
        try {
          elementId = new URL(linkOrButton.href).hostname;
        } catch {
          elementId = 'external-link';
        }
        elementType = 'external-link';
        section = undefined;
      }

      const textOverride = linkOrButton.getAttribute('data-analytics-text') || linkOrButton.getAttribute('data-tracking-text');
      const elementTextShort = textOverride != null
        ? String(textOverride).slice(0, 80)
        : (linkOrButton.innerText || linkOrButton.textContent || '').trim().slice(0, 80);

      const pageName = getPageName();

      trackEvent('click', {
        element_id: elementId,
        element_type: elementType,
        element_text_short: elementTextShort || undefined,
        section: section || undefined,
        entry_id: pageName || undefined,
      });
    },
    { passive: true }
  );
}

if (typeof window !== 'undefined') {
  window.analytics = {
    trackEvent,
    trackSearch,
    trackPageView,
    getPageName,
  };
}

export {
  trackEvent,
  trackSearch,
  trackPageView,
  initClickTracking,
  getPageName,
};

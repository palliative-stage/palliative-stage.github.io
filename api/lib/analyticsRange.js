/**
 * Inclusive calendar ranges for the analytics screen, in Asia/Jerusalem.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_INCLUSIVE_DAYS = 366;
const TIME_ZONE = 'Asia/Jerusalem';

function parseIsoDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return value;
}

function jerusalemToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function addIsoDays(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(from, to) {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  const start = Date.UTC(y1, m1 - 1, d1);
  const end = Date.UTC(y2, m2 - 1, d2);
  return Math.round((end - start) / 86400000);
}

function resolveAnalyticsRange({ from, to, now } = {}) {
  const today = jerusalemToday(now);
  const start = from == null || from === '' ? addIsoDays(today, -29) : parseIsoDate(from);
  const end = to == null || to === '' ? today : parseIsoDate(to);
  if (!start || !end || start > end) {
    return { error: 'invalid_range' };
  }
  if (daysBetween(start, end) + 1 > MAX_INCLUSIVE_DAYS) {
    return { error: 'range_too_long' };
  }
  return { from: start, to: end };
}

function enumerateDays(from, to) {
  const days = [];
  let cursor = from;
  while (cursor <= to) {
    days.push(cursor);
    cursor = addIsoDays(cursor, 1);
  }
  return days;
}

module.exports = {
  TIME_ZONE,
  parseIsoDate,
  jerusalemToday,
  addIsoDays,
  resolveAnalyticsRange,
  enumerateDays,
};

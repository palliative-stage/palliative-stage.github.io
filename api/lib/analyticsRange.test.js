const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resolveAnalyticsRange, enumerateDays } = require('./analyticsRange');

const NOW = new Date('2026-09-26T12:00:00Z');

describe('resolveAnalyticsRange', () => {
  it('defaults to the last 30 Jerusalem days including today', () => {
    const range = resolveAnalyticsRange({ now: NOW });
    assert.equal(range.from, '2026-08-28');
    assert.equal(range.to, '2026-09-26');
  });

  it('rejects an inverted range and an impossible date', () => {
    assert.equal(resolveAnalyticsRange({ from: '2026-09-26', to: '2026-09-01', now: NOW }).error, 'invalid_range');
    assert.equal(resolveAnalyticsRange({ from: '2026-02-31', to: '2026-03-01', now: NOW }).error, 'invalid_range');
  });

  it('rejects a range longer than 366 days', () => {
    const range = resolveAnalyticsRange({ from: '2025-01-01', to: '2026-01-02', now: NOW });
    assert.equal(range.error, 'range_too_long');
  });
});

describe('enumerateDays', () => {
  it('includes both ends', () => {
    assert.deepEqual(enumerateDays('2026-09-25', '2026-09-26'), ['2026-09-25', '2026-09-26']);
  });
});

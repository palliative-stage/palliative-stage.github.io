-- Error logging schema for PostgreSQL (e.g. Neon)
-- Run against the same database as analytics (DATABASE_URL).
--
-- Setup:
--   1. Run this script once before deploying /api/errors.
--   2. In Vercel, set RESEND_API_KEY, ERROR_ALERT_TO, ERROR_ALERT_FROM.
--   3. Optional: ERROR_EMAIL_ENABLED=true|false, ERRORS_ALLOWED_ORIGINS=...
--
-- Alerts: first occurrence of each failed_url + error_type within 24h triggers email;
--         duplicates are stored but do not send another email.

CREATE TABLE IF NOT EXISTS errors (
  error_id UUID PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL,
  error_type TEXT NOT NULL,
  status_code INTEGER,
  failed_url TEXT,
  link_text TEXT,
  page_url TEXT,
  page_route TEXT,
  session_id TEXT,
  user_pseudo_id TEXT,
  country TEXT,
  device_type TEXT,
  browser_name TEXT,
  os_name TEXT,
  language TEXT,
  referrer_domain TEXT,
  extra JSONB,
  email_sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_errors_occurred_at ON errors(occurred_at);
CREATE INDEX IF NOT EXISTS idx_errors_error_type ON errors(error_type);
CREATE INDEX IF NOT EXISTS idx_errors_failed_url ON errors(failed_url);
CREATE INDEX IF NOT EXISTS idx_errors_dedup ON errors(failed_url, error_type, occurred_at);

-- Privacy-friendly analytics schema for PostgreSQL (e.g. Neon)
-- Run this script to create the required tables before deploying the API.

CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  user_pseudo_id TEXT,
  country TEXT,
  device_type TEXT,
  first_event_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS events (
  event_id UUID PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(session_id),
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  page_url TEXT,
  page_route TEXT,
  section TEXT,
  element_id TEXT,
  element_type TEXT,
  element_text_short TEXT,
  search_query TEXT,
  results_count INTEGER,
  search_location TEXT,
  extra JSONB,
  entry_id VARCHAR(255),
  country TEXT,
  device_type TEXT,
  browser_name TEXT,
  os_name TEXT,
  language TEXT,
  referrer_domain VARCHAR(255),
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_entry_id ON events(entry_id);

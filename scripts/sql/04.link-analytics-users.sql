-- Link analytics visits to staff accounts.
-- sessions and events already exist. Anonymous visits keep a null user_id.

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE events ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sessions_user_id_fkey'
  ) THEN
    ALTER TABLE sessions
      ADD CONSTRAINT sessions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_user_id_fkey'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;
  END IF;
END $$;

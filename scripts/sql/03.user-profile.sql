-- Name and occupation on staff accounts. Already applied on production.

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_occupation_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_occupation_check
      CHECK (occupation IS NULL OR occupation IN ('doctor', 'nurse', 'social_worker', 'other'));
  END IF;
END $$;

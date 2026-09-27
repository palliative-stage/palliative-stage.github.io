-- Free-text profession for users whose occupation is 'other'.

ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation_other TEXT;

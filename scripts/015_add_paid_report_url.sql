-- Add paid_report_url to submissions table so users can retrieve their paid report later
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS paid_report_url text;

-- Index for fast lookup by name + birth_date + birth_time + birth_country
CREATE INDEX IF NOT EXISTS idx_submissions_lookup
  ON submissions (name, birth_date, birth_country, birth_time);

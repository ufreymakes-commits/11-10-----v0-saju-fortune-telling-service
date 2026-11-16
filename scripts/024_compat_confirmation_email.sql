-- Compatibility purchase email: one-time send flag. Run once in the Supabase SQL editor. Safe to re-run.
--
-- confirmation_email_sent_at is claimed atomically before sending (UPDATE ... WHERE confirmation_email_sent_at IS NULL),
-- so retries never send twice. It is cleared again only if the send itself fails.
ALTER TABLE compatibility_payments ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz;

-- Add context_interpretation column to reports table
-- This stores the 1500-char interpretation from Stage 1 for paid report context injection

ALTER TABLE reports ADD COLUMN IF NOT EXISTS context_interpretation TEXT;

-- Add comment for documentation
COMMENT ON COLUMN reports.context_interpretation IS 'Stage 1 1500-char saju interpretation for context injection in paid reports';

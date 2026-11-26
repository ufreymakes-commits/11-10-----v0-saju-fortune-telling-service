-- 2027 Snapshot for the $7.99 Gumiho checkout add-on (gumiho_payments.paypal_order_id LIKE 'BUNDLE-%').
-- current_situation / relationship_status: chosen under the 3 questions (add-on buyers only).
-- year_snapshot: generated JSON shown under the 3 answers. year_snapshot_status: null | 'generating' | 'done' | 'failed'.
-- Standalone $9.99 Gumiho rows keep these columns null.
ALTER TABLE public.gumiho_questions
  ADD COLUMN IF NOT EXISTS current_situation text,
  ADD COLUMN IF NOT EXISTS relationship_status text,
  ADD COLUMN IF NOT EXISTS year_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS year_snapshot_status text;

-- Gumiho bundle revocation: mark a refunded add-on entitlement as revoked without deleting any rows.
-- Run once in the Supabase SQL editor. Safe to re-run.
ALTER TABLE public.gumiho_payments
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_reason text;

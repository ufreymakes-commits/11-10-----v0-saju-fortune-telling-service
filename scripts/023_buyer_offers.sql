-- Buyer-only Compatibility offer ($15.99 vs regular $19.99), 24h from the first successful open of the paid 99 Facts report.
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- The clock is stored server-side: first_seen_at is written once (INSERT ... ON CONFLICT DO NOTHING)
-- and expires_at is fixed to first_seen_at + 24h, so refreshing or reopening the report never restarts it.

CREATE TABLE IF NOT EXISTS buyer_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  offer_key text NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  redeemed_at timestamptz,
  redeemed_payment_id uuid,
  CONSTRAINT buyer_offers_payment_offer_key UNIQUE (payment_id, offer_key),
  CONSTRAINT buyer_offers_expires_24h CHECK (expires_at = first_seen_at + interval '24 hours')
);

-- RLS on with no policies: anon/authenticated roles cannot read or write. Only the service role (server) can.
ALTER TABLE buyer_offers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON buyer_offers FROM anon, authenticated;

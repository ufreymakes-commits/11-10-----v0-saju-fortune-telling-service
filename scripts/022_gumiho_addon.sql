-- Gumiho bundle add-on: flag on the main report payment, plus a unique key so the
-- bundled Gumiho entitlement (paypal_order_id = 'BUNDLE-<order id>') can never be created twice.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS gumiho_addon boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS gumiho_payments_bundle_order_key
  ON public.gumiho_payments (paypal_order_id)
  WHERE paypal_order_id LIKE 'BUNDLE-%';

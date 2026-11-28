ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS checkout_via text, ADD COLUMN IF NOT EXISTS checkout_browser text;

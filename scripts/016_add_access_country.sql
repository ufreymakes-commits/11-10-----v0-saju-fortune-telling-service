ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS access_country text;

COMMENT ON COLUMN public.submissions.access_country IS
  'ISO country code of the request origin, from the x-vercel-ip-country header (IP itself is not stored)';

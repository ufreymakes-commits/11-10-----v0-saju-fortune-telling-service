ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS access_country text;

COMMENT ON COLUMN public.submissions.access_country IS
  'English full country name (e.g. South Korea) of the request origin, derived from the x-vercel-ip-country header (IP itself is not stored)';

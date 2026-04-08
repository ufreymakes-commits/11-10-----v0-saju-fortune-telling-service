-- Sajume Cache and Rate Limiting Tables
-- For cost optimization: caching AI results and preventing abuse

-- Saju Cache table: Cache AI-generated facts by saju 8-character key
-- Same saju (8 characters) = same results, no need to regenerate
CREATE TABLE IF NOT EXISTS saju_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saju_key TEXT UNIQUE NOT NULL, -- e.g., "갑자_을축_병인_정묘" (4 pillars concatenated)
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  free_facts JSONB NOT NULL, -- Cached 9 free facts
  teaser_facts JSONB NOT NULL, -- Cached 3 teaser facts
  model_used TEXT NOT NULL, -- e.g., 'claude-3-haiku', 'gpt-4o-mini'
  generation_time_ms INTEGER, -- How long it took to generate
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 1
);

-- Rate Limiting table: Track requests per IP
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INTEGER DEFAULT 1,
  last_request_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint per IP per day
  UNIQUE(ip_address, request_date)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_saju_cache_key ON saju_cache(saju_key);
CREATE INDEX IF NOT EXISTS idx_saju_cache_accessed ON saju_cache(last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_date ON rate_limits(ip_address, request_date);

-- Enable RLS
ALTER TABLE saju_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow all operations
DROP POLICY IF EXISTS "Allow all saju_cache" ON saju_cache;
CREATE POLICY "Allow all saju_cache" ON saju_cache FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all rate_limits" ON rate_limits;
CREATE POLICY "Allow all rate_limits" ON rate_limits FOR ALL USING (true) WITH CHECK (true);

-- Function to increment rate limit (upsert pattern)
CREATE OR REPLACE FUNCTION increment_rate_limit(p_ip TEXT)
RETURNS TABLE(current_count INTEGER, is_allowed BOOLEAN) AS $$
DECLARE
  v_count INTEGER;
  v_max_requests INTEGER := 3; -- Max 3 requests per IP per day
BEGIN
  INSERT INTO rate_limits (ip_address, request_date, request_count, last_request_at)
  VALUES (p_ip, CURRENT_DATE, 1, NOW())
  ON CONFLICT (ip_address, request_date) 
  DO UPDATE SET 
    request_count = rate_limits.request_count + 1,
    last_request_at = NOW()
  RETURNING request_count INTO v_count;
  
  RETURN QUERY SELECT v_count, v_count <= v_max_requests;
END;
$$ LANGUAGE plpgsql;

-- Function to update cache access stats
CREATE OR REPLACE FUNCTION update_cache_access(p_saju_key TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE saju_cache 
  SET 
    last_accessed_at = NOW(),
    access_count = access_count + 1
  WHERE saju_key = p_saju_key;
END;
$$ LANGUAGE plpgsql;

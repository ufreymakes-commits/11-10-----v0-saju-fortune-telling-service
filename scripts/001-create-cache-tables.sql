-- Create saju_cache table for caching reports based on 8-character saju
-- Same 8 characters (년월일시의 천간지지) should return the same cached content
CREATE TABLE IF NOT EXISTS saju_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saju_key VARCHAR(16) NOT NULL UNIQUE, -- 8 characters encoded (年干年支月干月支日干日支時干時支)
  free_facts JSONB NOT NULL, -- Cached 9 free facts
  deep_analysis JSONB, -- Cached deep analysis for premium
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_saju_cache_key ON saju_cache(saju_key);

-- Create daily_free_reports table for rate limiting
-- Limit 2 free reports per IP per day
CREATE TABLE IF NOT EXISTS daily_free_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address VARCHAR(45) NOT NULL, -- IPv4 or IPv6
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  report_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ip_address, report_date)
);

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_daily_reports_ip_date ON daily_free_reports(ip_address, report_date);

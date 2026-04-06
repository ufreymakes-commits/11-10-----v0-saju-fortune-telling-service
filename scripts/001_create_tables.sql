-- Sajume Database Schema
-- Tables for storing birth chart submissions, payments, and generated reports

-- Submissions table (stores birth info)
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_country TEXT NOT NULL,
  birth_time TIME,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  referral_source TEXT NOT NULL,
  saju_data JSONB, -- Calculated saju elements (사주팔자)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  paypal_order_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 9.99,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Reports table (stores generated facts)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id),
  section_key TEXT NOT NULL, -- e.g., 'free', 'personality', 'career', 'love', 'future'
  facts JSONB NOT NULL, -- Array of fact objects
  is_free BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_submission_id ON payments(submission_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_reports_submission_id ON reports(submission_id);
CREATE INDEX IF NOT EXISTS idx_reports_section_key ON reports(section_key);

-- Enable RLS (public access for this use case - no auth required)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no user auth required for this service)
DROP POLICY IF EXISTS "Allow all submissions" ON submissions;
CREATE POLICY "Allow all submissions" ON submissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all payments" ON payments;
CREATE POLICY "Allow all payments" ON payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all reports" ON reports;
CREATE POLICY "Allow all reports" ON reports FOR ALL USING (true) WITH CHECK (true);

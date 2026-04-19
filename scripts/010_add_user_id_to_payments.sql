-- Migration: Add user_id column to payments table
-- This allows logged-in users to claim their paid reports

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Allow authenticated users to read their own payments
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Allow service role (API routes) to update user_id (existing "Allow all payments" policy covers this for anon)
-- The existing "Allow all payments" policy remains so PayPal webhook can still write

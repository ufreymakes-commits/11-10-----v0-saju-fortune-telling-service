import postgres from 'postgres'

const sql = postgres(process.env.POSTGRES_URL_NON_POOLING, { ssl: 'require' })

try {
  await sql`
    ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
  `
  console.log('[v0] Added user_id column to payments')

  await sql`
    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)
  `
  console.log('[v0] Created index on payments.user_id')

  await sql`
    DROP POLICY IF EXISTS "Users can view own payments" ON payments
  `
  await sql`
    CREATE POLICY "Users can view own payments" ON payments
      FOR SELECT USING (auth.uid() = user_id)
  `
  console.log('[v0] Created RLS policy for user payments')

  console.log('[v0] Migration complete!')
} catch (err) {
  console.error('[v0] Migration error:', err.message)
} finally {
  await sql.end()
}

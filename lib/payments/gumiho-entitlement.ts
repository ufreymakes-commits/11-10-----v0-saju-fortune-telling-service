import { createAdminClient } from '@/lib/supabase/server'

/**
 * Returns the id of a bundled (paid with the report) Gumiho entitlement whose
 * 3 questions have not been asked yet, or null when there is none.
 */
export async function findUnusedGumihoEntitlement(submissionId: string): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const { data: payments } = await admin
      .from('gumiho_payments')
      .select('gumiho_question_id')
      .eq('submission_id', submissionId)
      .eq('status', 'completed')
      .like('paypal_order_id', 'BUNDLE-%')
      .not('gumiho_question_id', 'is', null)

    const ids = (payments ?? []).map((p) => p.gumiho_question_id as string)
    if (ids.length === 0) return null

    const { data: unused } = await admin
      .from('gumiho_questions')
      .select('id')
      .in('id', ids)
      .eq('question_1', '')
      .limit(1)
      .maybeSingle()

    return (unused?.id as string | undefined) ?? null
  } catch (e) {
    console.error('[v0] gumiho entitlement lookup error:', e instanceof Error ? e.message : 'unknown')
    return null
  }
}

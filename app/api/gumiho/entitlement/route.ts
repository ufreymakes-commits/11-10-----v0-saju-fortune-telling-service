import { NextResponse } from 'next/server'
import { getGumihoEntitlementState, healGumihoEntitlementForSubmission } from '@/lib/payments/gumiho-entitlement'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: Request) {
  const submissionId = new URL(request.url).searchParams.get('submissionId') ?? ''
  if (!UUID.test(submissionId)) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
  }
  await healGumihoEntitlementForSubmission(submissionId)
  const { unusedQuestionId, refunded } = await getGumihoEntitlementState(submissionId)
  return NextResponse.json({ gumihoQuestionId: unusedQuestionId, refunded })
}

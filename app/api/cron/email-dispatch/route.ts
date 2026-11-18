import { NextResponse } from 'next/server'
import { runEmailDispatch } from '@/lib/email/dispatch'

export const maxDuration = 60

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const summary = await runEmailDispatch()
  return NextResponse.json({ ok: true, ...summary })
}

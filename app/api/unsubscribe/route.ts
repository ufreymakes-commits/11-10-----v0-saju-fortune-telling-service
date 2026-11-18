import { NextResponse } from 'next/server'
import { unsubscribeByToken } from '@/lib/email/contacts'

// Invalid tokens also get a normal response so the endpoint reveals nothing about which tokens exist.

// Link click from a mail client: unsubscribe, then show the confirmation page.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('t')
  await unsubscribeByToken(token)
  const target = new URL('/unsubscribe', url)
  if (token) target.searchParams.set('t', token)
  return NextResponse.redirect(target, 303)
}

// Gmail/Apple one-click (List-Unsubscribe-Post). The body is ignored; the token comes from the query string.
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get('t')
  await unsubscribeByToken(token)
  return NextResponse.json({ ok: true })
}

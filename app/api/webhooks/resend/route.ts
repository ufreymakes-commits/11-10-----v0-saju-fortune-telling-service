import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { markContactDeliveryProblem } from '@/lib/email/contacts'

const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60

// Svix signature check: HMAC-SHA256 over "<id>.<timestamp>.<body>" with the base64 part of the whsec_ secret.
function isValidSvixSignature(request: Request, rawBody: string, secret: string): boolean {
  const id = request.headers.get('svix-id')
  const timestamp = request.headers.get('svix-timestamp')
  const signatureHeader = request.headers.get('svix-signature')
  if (!id || !timestamp || !signatureHeader) return false

  const sentAt = Number(timestamp)
  if (!Number.isFinite(sentAt) || Math.abs(Date.now() / 1000 - sentAt) > TIMESTAMP_TOLERANCE_SECONDS) return false

  const key = Buffer.from(secret.startsWith('whsec_') ? secret.slice(6) : secret, 'base64')
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest()

  return signatureHeader.split(' ').some((part) => {
    const [version, value] = part.split(',')
    if (version !== 'v1' || !value) return false
    const candidate = Buffer.from(value, 'base64')
    return candidate.length === expected.length && timingSafeEqual(candidate, expected)
  })
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  const rawBody = await request.text()
  if (!secret || !isValidSvixSignature(request, rawBody, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    const event = JSON.parse(rawBody) as { type?: string; data?: { to?: string[] | string } }
    const recipients = Array.isArray(event.data?.to) ? event.data.to : [event.data?.to]

    if (event.type === 'email.bounced' || event.type === 'email.complained') {
      const kind = event.type === 'email.bounced' ? 'bounced' : 'complained'
      for (const recipient of recipients) await markContactDeliveryProblem(recipient, kind)
      console.log(`[v0] resend webhook: ${event.type} handled`)
    }
  } catch (e) {
    console.error('[v0] resend webhook: payload error:', e instanceof Error ? e.message : 'unknown')
  }

  return NextResponse.json({ ok: true })
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { unsubscribeByToken } from '@/lib/email/contacts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Unsubscribed - Sajume',
  robots: { index: false, follow: false },
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string | string[] }>
}) {
  const { t } = await searchParams
  await unsubscribeByToken(Array.isArray(t) ? t[0] : t)

  return (
    <main className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold text-white text-balance">You&apos;ve been unsubscribed.</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/70 text-pretty">
          You&apos;ll still receive receipts and reports you purchase.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm text-white/60 underline underline-offset-4">
          Back to Sajume
        </Link>
      </div>
    </main>
  )
}

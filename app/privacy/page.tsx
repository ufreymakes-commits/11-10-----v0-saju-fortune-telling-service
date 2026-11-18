import type { Metadata } from 'next'
import { PolicyContent } from '@/components/policy-content'
import { sharedOpenGraph, sharedTwitter } from '@/lib/metadata'
import { PRIVACY_POLICY } from '@/lib/policies'

const title = 'Privacy Policy - Sajume'

export const metadata: Metadata = {
  title,
  description: 'How Sajume collects, uses and protects your information.',
  openGraph: { ...sharedOpenGraph, title },
  twitter: { ...sharedTwitter, title },
}

export default function PrivacyPage() {
  return <PolicyContent policy={PRIVACY_POLICY} />
}

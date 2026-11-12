import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PolicyContent } from '@/components/policy-content'
import { sharedOpenGraph, sharedTwitter } from '@/lib/metadata'
import { POLICIES, getPolicy } from '@/lib/policies'

export const dynamicParams = false

export function generateStaticParams() {
  return POLICIES.map((policy) => ({ slug: policy.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const policy = getPolicy(slug)
  if (!policy) return {}

  const title = `${policy.title.replace(/^\d+\.\s*/, '')} - Sajume`
  return {
    title,
    description: `${policy.title.replace(/^\d+\.\s*/, '')} for Sajume digital Saju readings and compatibility reports.`,
    openGraph: { ...sharedOpenGraph, title },
    twitter: { ...sharedTwitter, title },
  }
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const policy = getPolicy(slug)
  if (!policy) notFound()

  return <PolicyContent policy={policy} />
}

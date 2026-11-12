import Link from 'next/link'
import { Fragment } from 'react'
import { StarsBackground } from '@/components/stars-background'
import {
  CONTACT_FORM_URL,
  POLICIES,
  POLICY_META,
  SUPPORT_EMAIL,
  type Policy,
} from '@/lib/policies'

const LINK_CLASS =
  'text-primary underline underline-offset-2 hover:text-primary/70 transition-colors'

const AUTO_LINK_PATTERN = /(hello@sajume\.com|tally\.so\/r\/681NVP|Refund and Dispute Policy|Refund Policy)/

function renderInline(text: string) {
  return text.split(AUTO_LINK_PATTERN).map((part, index) => {
    if (part === SUPPORT_EMAIL) {
      return (
        <a key={index} href={`mailto:${SUPPORT_EMAIL}`} className={LINK_CLASS}>
          {part}
        </a>
      )
    }
    if (part === 'tally.so/r/681NVP') {
      return (
        <a key={index} href={CONTACT_FORM_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {part}
        </a>
      )
    }
    if (part === 'Refund and Dispute Policy' || part === 'Refund Policy') {
      return (
        <Link key={index} href="/policies/refund-dispute-policy" className={LINK_CLASS}>
          {part}
        </Link>
      )
    }
    return <Fragment key={index}>{part}</Fragment>
  })
}

export function PolicyContent({ policy }: { policy: Policy }) {
  return (
    <main className="min-h-screen bg-mystical relative overflow-hidden pt-10">
      <StarsBackground />
      <div className="relative z-10 max-w-2xl mx-auto px-6 pb-16">
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          &larr; Back to Sajume
        </Link>

        <header className="mt-8 mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-primary/60">{POLICY_META.name}</p>
          <h1 className="mt-2 text-2xl md:text-3xl font-bold text-foreground text-balance">
            {policy.title}
          </h1>
          <dl className="mt-4 space-y-1 text-xs text-muted-foreground">
            <div className="flex gap-1.5">
              <dt>Last updated:</dt>
              <dd>{POLICY_META.lastUpdated}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt>Operated by:</dt>
              <dd>{POLICY_META.operatedBy}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt>Website:</dt>
              <dd>
                <a href={POLICY_META.website} className={LINK_CLASS}>
                  {POLICY_META.website}
                </a>
              </dd>
            </div>
          </dl>
        </header>

        <article className="space-y-4 text-sm md:text-base leading-relaxed text-muted-foreground">
          {policy.blocks.map((block, index) => {
            if (block.type === 'p') {
              return <p key={index}>{renderInline(block.text)}</p>
            }
            const ListTag = block.type === 'ol' ? 'ol' : 'ul'
            const listStyle = block.type === 'ol' ? 'list-decimal' : 'list-disc'
            return (
              <ListTag key={index} className={`${listStyle} pl-5 space-y-2 marker:text-primary/50`}>
                {block.items.map((item) => (
                  <li key={item}>{renderInline(item)}</li>
                ))}
              </ListTag>
            )
          })}
        </article>

        <nav aria-label="Store policies" className="mt-12 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground/70 mb-3">More store policies</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            {POLICIES.filter((p) => p.slug !== policy.slug).map((p) => (
              <li key={p.slug}>
                <Link href={`/policies/${p.slug}`} className="text-muted-foreground hover:text-foreground transition-colors">
                  {p.footerLabel}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  )
}

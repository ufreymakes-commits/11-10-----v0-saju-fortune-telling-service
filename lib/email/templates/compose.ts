import { CRM_SITE_URL } from '@/lib/email/config'
import { COMPAT_BUYER_PRICE_USD, COMPAT_PRICE_USD } from '@/lib/payments/paypal-orders'
import { REVIEW_EMILY, REVIEW_JASMINE, REVIEW_SALINA, reviewLine } from '@/lib/email/reviews'
import {
  bulletList,
  imageBlock,
  linkSentence,
  paragraph,
  strongParagraph,
  type Piece,
} from '@/lib/email/templates/layout'
import type { TemplateData } from '@/lib/email/templates/data'

export const CRM_TEMPLATE_KEYS = ['A2', 'A3', 'B1', 'B2', 'C2', 'C3', 'C4', 'W1'] as const
export type CrmTemplateKey = (typeof CRM_TEMPLATE_KEYS)[number]

export interface ComposedEmail {
  subject: string
  pieces: Piece[]
  category: 'marketing' | 'transactional'
}

const emailImage = (file: string) => `${CRM_SITE_URL}/email/${file}`

// Matches the nine sections the report renders (lib/saju/tails.ts) plus the cards and the closing letter.
const REPORT_CONTENTS = [
  'Your Day Master, Five Elements and Orb cards',
  'The Red Tail: Who You Really Are',
  'The Orange Tail: The Child You Were',
  'The Yellow Tail: Where You Are Now',
  'The Green Tail: Your Work and Calling',
  'The Blue Tail: Your Money Flow',
  'The Indigo Tail: Your Heart and Love',
  'The Violet Tail: A Letter From Your Future',
  'The White Tail: Your Sacred Space',
  'The Black Tail: Your Next Chapter',
  'A closing letter from your Gumiho',
]

// "Nov 19, 4:15 PM UTC"
export function formatExpiry(iso: string): string {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(new Date(iso))
    .replace(/\u202f/g, ' ')
  return `${formatted} UTC`
}

const checkoutUrl = (submissionId: string) => `${CRM_SITE_URL}/checkout/${submissionId}`

export function composeEmail(key: CrmTemplateKey, data: TemplateData): ComposedEmail {
  const hi = paragraph(`Hi ${data.firstName},`)

  switch (key) {
    case 'A2':
      return {
        subject: 'Your chart has more to say',
        category: 'marketing',
        pieces: [
          hi,
          paragraph('Your free reading showed you a few facts. Your full chart has 99.'),
          paragraph("Here's what's inside the full report:"),
          bulletList(REPORT_CONTENTS),
          imageBlock(emailImage('report-cards.png'), 'Your Saju cards'),
          imageBlock(emailImage('report-sections.png'), 'The nine tails of your report'),
          imageBlock(emailImage('report-red-tail.png'), 'A section from a sample report'),
          imageBlock(emailImage('report-letter.png'), 'A closing letter from a sample report'),
          paragraph('A line from a sample report:'),
          paragraph(
            '"Your way works because you do not chase external approval; you cultivate quiet self-possession and let your refined results speak for themselves."',
          ),
          linkSentence({
            before: 'You can ',
            label: 'see your full report here',
            after: '.',
            url: checkoutUrl(data.submissionId),
            templateKey: key,
          }),
        ],
      }

    case 'A3':
      return {
        subject: 'Why Sajume is calculated, not guessed',
        category: 'marketing',
        pieces: [
          hi,
          paragraph(
            "A lot of people tell us the same thing: they almost didn't try Sajume because they thought it might be a scam.",
          ),
          paragraph(
            "Fair enough. Here's how it actually works. Your report is built from your exact birth date and time using the traditional Saju (Four Pillars) system. The same birth data always gives the same chart. No guru, no guessing. Saju offers probabilistic hints, not certainties.",
          ),
          paragraph("Here's what three people said after reading theirs:"),
          paragraph(reviewLine(REVIEW_EMILY)),
          paragraph(reviewLine(REVIEW_JASMINE)),
          paragraph(reviewLine(REVIEW_SALINA)),
          paragraph('And if your report ever fails to generate, you get a full refund.'),
          linkSentence({
            before: "When you're ready, ",
            label: 'your full report is here',
            after: '.',
            url: checkoutUrl(data.submissionId),
            templateKey: key,
          }),
        ],
      }

    case 'B1':
      return {
        subject: 'You left your report at checkout',
        category: 'marketing',
        pieces: [
          hi,
          linkSentence({
            before: 'Your full 99 Facts report is still waiting for you. ',
            label: 'Pick up right where you left off',
            after: '.',
            url: checkoutUrl(data.submissionId),
            templateKey: key,
          }),
          paragraph('If your report ever fails to generate, you get a full refund.'),
        ],
      }

    case 'B2':
      return {
        subject: 'Questions before you buy?',
        category: 'marketing',
        pieces: [
          hi,
          paragraph('Here are the three questions we hear most:'),
          strongParagraph('How long does it take?'),
          paragraph('Most reports are ready in about 2 minutes.'),
          strongParagraph('How do I get it?'),
          paragraph(
            'It opens right in your browser, and we email you a private link so you can come back to it anytime.',
          ),
          strongParagraph('How accurate is it?'),
          paragraph(
            "It's calculated from your exact birth data using traditional Saju rules, so the same input always gives the same chart. Saju offers probabilistic hints, not certainties.",
          ),
          paragraph('One reader put it this way:'),
          paragraph(reviewLine(REVIEW_EMILY)),
          paragraph('Got another question? Just hit reply. I read every email.'),
          linkSentence({
            before: "Whenever you're ready, ",
            label: 'you can finish your order here',
            after: '.',
            url: checkoutUrl(data.submissionId),
            templateKey: key,
          }),
        ],
      }

    case 'C2':
      return {
        subject: 'Your compatibility price ends in 3 hours',
        category: 'marketing',
        pieces: [
          hi,
          paragraph(
            `Because you have your full report, you can check your compatibility with anyone (your crush, partner, favorite idol, even your ex) for $${COMPAT_BUYER_PRICE_USD} instead of $${COMPAT_PRICE_USD}.`,
          ),
          linkSentence({
            before: `This price ends at ${data.offerExpiresAt ? formatExpiry(data.offerExpiresAt) : 'the time shown on your report'}. `,
            label: 'Check your compatibility here',
            after: ' before it ends.',
            url: `${CRM_SITE_URL}/compatibility?offer=${data.submissionId}`,
            templateKey: key,
          }),
        ],
      }

    case 'C3':
      return {
        subject: 'How did your report feel?',
        category: 'marketing',
        pieces: [
          hi,
          paragraph("It's been a few days since you read your report, and I'd love to know one thing:"),
          paragraph('Which line hit the hardest?'),
          paragraph('Just hit reply. One sentence is plenty.'),
        ],
      }

    case 'C4': {
      const pieces: Piece[] = [
        hi,
        linkSentence({
          before:
            'If your report made you think of someone (a friend, a sibling, a partner), they can get their own free Saju reading at ',
          label: 'my.sajume.com',
          after: '.',
          url: `${CRM_SITE_URL}/start`,
          templateKey: key,
        }),
      ]
      if (!data.hasGumiho) {
        pieces.push(
          linkSentence({
            before: 'P.S. Still curious about your own chart? You can ',
            label: 'ask Gumiho 3 personal questions',
            after: ' and get answers based on your chart.',
            url: `${CRM_SITE_URL}/ask-gumiho/${data.submissionId}`,
            templateKey: key,
          }),
        )
      }
      return { subject: 'Know someone who\u2019d love their chart?', category: 'marketing', pieces }
    }

    case 'W1':
      return {
        subject: "You're on the list",
        category: 'transactional',
        pieces: [
          paragraph('Hi there,'),
          paragraph(
            "Thanks for joining the waitlist for My 100-Year Golden Luck Timeline + 2027 Monthly Calendar. We'll email you once when it launches, by the end of 2026.",
          ),
        ],
      }
  }
}

export type PolicyBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }

export type Policy = {
  slug: string
  footerLabel: string
  title: string
  blocks: PolicyBlock[]
}

export const POLICY_META = {
  name: 'Sajume Store Policies',
  lastUpdated: 'November 12, 2026',
  operatedBy: 'Lets Hit Creative, Seoul, South Korea',
  website: 'https://my.sajume.com',
}

export const SUPPORT_EMAIL = 'hello@sajume.com'
export const CONTACT_FORM_URL = 'https://tally.so/r/681NVP'

export const POLICIES: Policy[] = [
  {
    slug: 'customer-service',
    footerLabel: 'Customer Service',
    title: '1. Customer Service',
    blocks: [
      { type: 'p', text: 'We are happy to help with anything about your order or your report.' },
      {
        type: 'ul',
        items: [
          `Email: ${SUPPORT_EMAIL}`,
          'Contact form: tally.so/r/681NVP',
          'Response time: within 2 business days (Monday to Friday)',
          'Please include the name and birth date you used, the email you ordered with, and your order or report link, so we can find your order quickly.',
        ],
      },
    ],
  },
  {
    slug: 'return-policy',
    footerLabel: 'Return Policy',
    title: '2. Return Policy',
    blocks: [
      {
        type: 'p',
        text: 'Sajume sells digital products only: online Saju readings, compatibility reports, and answers to your questions. We do not sell or ship physical goods on this website, so there is nothing to return or ship back. See the Refund and Dispute Policy for what happens if something goes wrong.',
      },
    ],
  },
  {
    slug: 'refund-dispute-policy',
    footerLabel: 'Refund & Dispute',
    title: '3. Refund and Dispute Policy',
    blocks: [
      {
        type: 'p',
        text: 'Our reports are created for you on request and delivered right away, so purchases are generally non-refundable once the report has been generated. We will gladly make it right in these cases:',
      },
      {
        type: 'ul',
        items: [
          'You were charged but did not receive your report or answers.',
          'You were charged more than once for the same order.',
          'A technical problem on our side made the report unreadable or incomplete.',
          'You entered a wrong birth detail by mistake and contact us within 7 days of purchase. We will regenerate the report once at no cost.',
        ],
      },
      { type: 'p', text: 'How to ask for a refund:' },
      {
        type: 'ol',
        items: [
          `Email ${SUPPORT_EMAIL} within 14 days of your purchase.`,
          'Tell us your order details and what went wrong.',
          'We reply within 2 business days. Approved refunds go back to your original payment method (PayPal or card) and usually appear within 5 to 10 business days.',
        ],
      },
      {
        type: 'p',
        text: 'Disputes: please contact us first. We resolve most problems quickly. If you open a dispute with PayPal or your card issuer, we will respond with your order details and delivery records. A dispute opened without contacting us first may delay your refund.',
      },
      {
        type: 'p',
        text: 'If you live in the EU, UK, or another region where you have a legal right to withdraw from digital purchases: by completing your purchase you ask us to start delivering your report immediately, and you acknowledge that your right of withdrawal ends once delivery begins, to the extent the law allows.',
      },
    ],
  },
  {
    slug: 'cancellation-policy',
    footerLabel: 'Cancellation',
    title: '4. Cancellation Policy',
    blocks: [
      {
        type: 'p',
        text: 'All Sajume purchases are one-time payments. We do not offer subscriptions and we never charge you again automatically.',
      },
      {
        type: 'ul',
        items: [
          'You can cancel an order only before your report or answers start generating, which usually happens within seconds of payment. If you need to cancel, email us right away.',
          'After generation starts, the order cannot be canceled, but the Refund and Dispute Policy still applies.',
        ],
      },
    ],
  },
  {
    slug: 'legal-export-restrictions',
    footerLabel: 'Legal & Export',
    title: '5. Legal and Export Restrictions',
    blocks: [
      {
        type: 'ul',
        items: [
          'Sajume is provided for entertainment and personal reflection. It is not medical, legal, financial, or mental health advice, and it does not predict or guarantee any specific event. Please use your own judgment for important decisions.',
          "You must be 18 or older to purchase, or have a parent or guardian's permission.",
          'Our reports are digital and are delivered online. We follow applicable U.S. and international trade laws and economic sanctions. We cannot accept orders from people or places that are subject to such sanctions, or from countries where our payment provider does not operate.',
          'Reports are for your personal use. Please do not resell or republish them as your own commercial product.',
          'We use the birth details you give us only to create your reports.',
        ],
      },
    ],
  },
  {
    slug: 'promotion-terms',
    footerLabel: 'Promotions',
    title: '6. Terms and Conditions of Promotions',
    blocks: [
      {
        type: 'p',
        text: 'These terms apply to coupon codes, discounts, free reports, and any other promotion from Sajume.',
      },
      {
        type: 'ul',
        items: [
          'Promotions are available for a limited time and while supplies last. We may change or end any promotion at any time without notice.',
          'Each coupon code is for one customer and one use unless the promotion clearly says otherwise.',
          'A promotion may only be used for the product it was made for, cannot be combined with another promotion, and has no cash value.',
          'Coupon codes are not transferable and may not be sold or posted publicly.',
          'If you receive a report with a coupon or free promotion, it is delivered the same way as a paid report and is covered by the same terms.',
          'We may cancel an order and void a coupon if we find misuse, such as sharing codes or creating many accounts to claim offers repeatedly.',
          'Promotions that offer a discount are not refundable as cash or store credit. If an order paid with a discount is refunded under our Refund Policy, you get back the amount you actually paid.',
          `Questions about a promotion? Email ${SUPPORT_EMAIL}.`,
        ],
      },
    ],
  },
]

export function getPolicy(slug: string) {
  return POLICIES.find((p) => p.slug === slug)
}

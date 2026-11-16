import ReactMarkdown, { type Components } from 'react-markdown'

const ALLOWED_ELEMENTS = ['p', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'br']

const components: Components = {
  p: ({ children }) => <p className="text-[15px] leading-relaxed text-foreground text-pretty">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="space-y-2 pl-5 list-disc marker:text-primary">{children}</ul>,
  ol: ({ children }) => <ol className="space-y-2 pl-5 list-decimal marker:text-primary">{children}</ol>,
  li: ({ children }) => <li className="text-[15px] leading-relaxed text-foreground pl-1 text-pretty">{children}</li>,
  h1: ({ children }) => <h3 className="pt-2 text-xs font-semibold uppercase tracking-wider text-primary text-balance">{children}</h3>,
  h2: ({ children }) => <h3 className="pt-2 text-xs font-semibold uppercase tracking-wider text-primary text-balance">{children}</h3>,
  h3: ({ children }) => <h3 className="pt-2 text-xs font-semibold uppercase tracking-wider text-primary text-balance">{children}</h3>,
  h4: ({ children }) => <h3 className="pt-2 text-xs font-semibold uppercase tracking-wider text-primary text-balance">{children}</h3>,
}

/**
 * Renders a Gumiho answer as Markdown. Raw HTML is never rendered (react-markdown escapes it)
 * and only a small set of elements is allowed. Older plain-text answers render as normal paragraphs.
 */
export function GumihoAnswer({ text }: { text: string }) {
  return (
    <div className="mt-3 space-y-3 break-words">
      <ReactMarkdown allowedElements={ALLOWED_ELEMENTS} unwrapDisallowed components={components}>
        {text}
      </ReactMarkdown>
    </div>
  )
}

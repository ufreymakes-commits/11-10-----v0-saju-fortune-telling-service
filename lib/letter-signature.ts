const SIGNATURE_LINE = /^[ \t]*(?:[-\u2013\u2014]+[ \t]*)?Your Gumiho[.!]?[ \t]*$/gim
const TRAILING_SIGNATURE = /\s*(?:[-\u2013\u2014]+\s*)?Your Gumiho[.!]?\s*$/i

// 편지 본문에서 "Your Gumiho" 서명을 모두 제거한다. 서명은 화면 하단에서 한 번만 그린다.
export function stripGumihoSignature(text: string): string {
  return text.replace(SIGNATURE_LINE, '').replace(TRAILING_SIGNATURE, '').replace(/\n{3,}/g, '\n\n').trim()
}

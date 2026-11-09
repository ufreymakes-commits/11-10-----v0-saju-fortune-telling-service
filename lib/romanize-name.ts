// 한글 이름을 표기용 로마자(국어의 로마자 표기법, 음운 변화 없이 글자 단위)로 바꾼다. 한글이 없으면 그대로 돌려준다.
// 유료 리포트의 CJK 정리 단계가 고객 이름의 한글을 지워 "이름이 비는" 문제를 막기 위해 사용한다.
const INITIAL = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h']
const MEDIAL = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i']
const FINAL = ['', 'k', 'kk', 'ks', 'n', 'nj', 'nh', 't', 'l', 'lk', 'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'p', 'ps', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't']

export function romanizeName(name: string): string {
  const out = [...String(name ?? '')].map((ch) => {
    const c = ch.charCodeAt(0) - 0xac00
    if (c < 0 || c > 11171) return ch
    return INITIAL[Math.floor(c / 588)] + MEDIAL[Math.floor((c % 588) / 28)] + FINAL[c % 28]
  }).join('')
  return out.split(/(\s+)/).map((w) => (/^[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w)).join('').trim()
}
export const hasCJK = (s: string) => /[ㄱ-힝一-鿿]/.test(s)

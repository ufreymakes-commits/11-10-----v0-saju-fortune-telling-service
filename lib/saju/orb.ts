// 구슬(Orb): 일간별 구슬 이미지 10종 + 개인별 이름 + 희소성 숫자. 이름과 숫자는 코드가 정한다(AI가 짓지 않음).
import rarityTable from './rarity-table.json'

const STEM_KEY: Record<string, string> = { 갑: 'gap', 을: 'eul', 병: 'byeong', 정: 'jeong', 무: 'mu', 기: 'gi', 경: 'gyeong', 신: 'sin', 임: 'im', 계: 'gye' }
const HANJA_TO_KO: Record<string, string> = { 甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무', 己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계' }
const BASE: Record<string, string> = {
  gap: 'Ancient Tree', eul: 'Wild Vine', byeong: 'Blazing Sun', jeong: 'Candle Flame', mu: 'Mountain',
  gi: 'Fertile Field', gyeong: 'Raw Iron', sin: 'Polished Jewel', im: 'Open Ocean', gye: 'Soft Rain',
}
const EL_OF_KEY: Record<string, string> = { gap: 'Wood', eul: 'Wood', byeong: 'Fire', jeong: 'Fire', mu: 'Earth', gi: 'Earth', gyeong: 'Metal', sin: 'Metal', im: 'Water', gye: 'Water' }
const SPRING = ['인', '묘', '진'], AUTUMN = ['신', '유', '술']
const BRANCH_HANJA_TO_KO: Record<string, string> = { 子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사', 午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해' }

export type OrbInfo = {
  imageKey: string // 이미지 파일 이름용: gap | eul | byeong | jeong | mu | gi | gyeong | sin | im | gye
  name: string // 예: "Sun-Baked Fertile Field Orb"
  element: string
  subtitle: string // 예: "Strong · hot and dry season"
  rarity: { dayPillarOneIn: number; elementPattern: { oneIn: number; text: string } | null; missingElement: { element: string; text: string } | null }
}

export function buildOrb(saju: any, finalFacts: any): OrbInfo | null {
  const stemRaw: string = saju?.dayPillar?.stem ?? ''
  const stemKo = HANJA_TO_KO[stemRaw] ?? stemRaw
  const key = STEM_KEY[stemKo]
  if (!key) return null
  const climate: string | null = finalFacts?.yongsin?.climate?.kind ?? null
  const monthBr = BRANCH_HANJA_TO_KO[saju?.monthPillar?.branch] ?? saju?.monthPillar?.branch
  const adj = climate === 'hot and dry' ? 'Sun-Baked' : climate === 'cold and damp' ? 'Frost-Touched' : SPRING.includes(monthBr) ? 'Budding' : AUTUMN.includes(monthBr) ? 'Harvest' : 'Steady'
  const season = climate === 'hot and dry' ? 'hot and dry season' : climate === 'cold and damp' ? 'cold and damp season' : SPRING.includes(monthBr) ? 'spring season' : AUTUMN.includes(monthBr) ? 'autumn season' : 'balanced season'
  const grade = String(finalFacts?.strength?.grade ?? '')
  const strength = /weak/i.test(grade) ? 'Gentle' : /balanced/i.test(grade) ? 'Balanced' : 'Strong'

  // 희소성: 일주 60개 중 1개(정확). 오행 분포와 비어 있는 오행은 시뮬레이션 표(1950~2010, 15만 차트)로 계산.
  const c = saju?.elementCountBasic
  let elementPattern: OrbInfo['rarity']['elementPattern'] = null
  let missingElement: OrbInfo['rarity']['missingElement'] = null
  if (c && saju?.hourPillar?.stem) {
    const arr = [c.wood, c.fire, c.earth, c.metal, c.water]
    const sig = arr.join('')
    const { n, counts } = rarityTable as any
    const hit = counts[sig] ?? 0
    const oneIn = Math.max(1, Math.round(n / Math.max(1, hit)))
    elementPattern = { oneIn, text: hit < 3 ? `a very rare element mix (fewer than 1 in ${Math.round(n / 3).toLocaleString('en-US')} charts)` : `about 1 in ${oneIn.toLocaleString('en-US')} birth charts share your exact element mix` }
    const names = ['Wood', 'Fire', 'Earth', 'Metal', 'Water']
    const zeros = arr.map((v: number, i: number) => (v === 0 ? i : -1)).filter((i: number) => i >= 0)
    if (zeros.length) {
      let m = 0
      for (const [s, v] of Object.entries(counts as Record<string, number>)) if (zeros.every((i: number) => s[i] === '0')) m += v
      const pct = Math.round((m / n) * 100)
      const label = zeros.map((i: number) => names[i]).join(' and ')
      missingElement = { element: label, text: pct > 20 ? `about ${pct}% of birth charts have no visible ${label}` : `only about ${pct}% of birth charts have no visible ${label} at all` }
    }
  }
  return { imageKey: key, name: `${adj} ${BASE[key]} Orb`, element: EL_OF_KEY[key], subtitle: `${strength} · ${season}`, rarity: { dayPillarOneIn: 60, elementPattern, missingElement } }
}

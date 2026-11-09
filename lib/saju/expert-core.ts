// 전문가(경쟁사 레퍼런스) 알고리즘 역산 — 10건 만세력 PDF에서 10/10 재현된 규칙
// 위치별 고정 가중치(합 120)로 '받치는 힘'을 계산하고, 그 결과로 신강신약·억부용신(격 이름)·격국을 정한다.
export type Group = '비겁' | '식상' | '재성' | '관성' | '인성'
const STEMS = '갑을병정무기경신임계'
const EL: Record<string, number> = { 갑: 0, 을: 0, 병: 1, 정: 1, 무: 2, 기: 2, 경: 3, 신: 3, 임: 4, 계: 4 }
const MAIN: Record<string, string> = { 자: '계', 축: '기', 인: '갑', 묘: '을', 진: '무', 사: '병', 오: '정', 미: '기', 신: '경', 유: '신', 술: '무', 해: '임' }
// 본기 → 중기 → 여기
const HID: Record<string, string[]> = { 자: ['계', '임'], 축: ['기', '신', '계'], 인: ['갑', '병', '무'], 묘: ['을', '갑'], 진: ['무', '계', '을'], 사: ['병', '경', '무'], 오: ['정', '기', '병'], 미: ['기', '을', '정'], 신: ['경', '임', '무'], 유: ['신', '경'], 술: ['무', '정', '신'], 해: ['임', '갑', '무'] }
export const POSITION_WEIGHT = { 연간: 5, 연지: 9, 월간: 10, 월지: 30, 일간: 20, 일지: 21, 시간: 10, 시지: 15 } as const
const GROUPS: Group[] = ['비겁', '식상', '재성', '관성', '인성']
export const group = (dm: string, x: string): Group => GROUPS[(EL[x] - EL[dm] + 5) % 5]
export function tenGod(dm: string, x: string): string {
  const g = group(dm, x); const same = STEMS.indexOf(dm) % 2 === STEMS.indexOf(x) % 2
  const t: Record<Group, [string, string]> = { 비겁: ['비견', '겁재'], 식상: ['식신', '상관'], 재성: ['편재', '정재'], 관성: ['편관', '정관'], 인성: ['편인', '정인'] }
  return t[g][same ? 0 : 1]
}
const EOK_TABLE: Record<string, { yong: Group[]; hee: Group[]; why: string }> = {
  군비쟁재격: { yong: ['관성'], hee: ['식상', '재성'], why: '같은 편이 너무 많은 판 → 관성' },
  인중용재격: { yong: ['재성'], hee: ['식상'], why: '받쳐주는 힘이 과한 판 → 재성' },
  관살태과격: { yong: ['인성'], hee: ['비겁'], why: '책임과 압박이 과한 판 → 인성' },
  재중용비격: { yong: ['비겁'], hee: ['인성'], why: '재물이 무거워 약해진 판 → 비겁' },
  진상관용인격: { yong: ['인성'], hee: [], why: '(미검증: 표본 없음)' },
}
const GYEOK_YONG: Record<string, Group[]> = { 정인격: ['관성', '비겁'], 정관격: ['인성'], 정재격: ['식상', '관성'], 상관격: ['인성', '재성', '관성'], 비견격: ['관성', '식상'], 편인격: ['재성'], 편관격: ['식상'] }
export interface ExpertResult {
  support: number; against: number; grade: '신약' | '중화신약' | '중화신강' | '신강'; strong: boolean
  totals: Record<Group, number>; gyeok: string; gyeokTuchul: boolean; gyeokYong: Group[] | null
  eokName: string; eokYong: Group[]; eokHee: Group[]; border: boolean; borderGap: number; borderBy: string; outlier: string | null
  johu: { applicable: boolean; kind: '조열' | '한습' | null; urgent: boolean; elements: string[]; share: number }
  headline: { source: '조후' | '억부'; elements: string[] }   // 정답지 맨 위 "용신" (오행, 한글)
}
const ELEMS = ['목', '화', '토', '금', '수']
// 조후가 해결돼 있는지: 조후 오행이 차지한 자리 가중치 비율이 이 값 미만이면 '아직 급함' (표본: 급함 0·0·24%·28%, 맞춰짐 54% → 42%로 임시 설정)
export const JOHU_URGENT_BELOW = 0.42
export function analyzeExpert(p: { yearStem: string; yearBranch: string; monthStem: string; monthBranch: string; dayStem: string; dayBranch: string; hourStem?: string | null; hourBranch?: string | null }): ExpertResult {
  const dm = p.dayStem
  const sl: Record<string, string> = { 연간: p.yearStem, 연지: p.yearBranch, 월간: p.monthStem, 월지: p.monthBranch, 일간: p.dayStem, 일지: p.dayBranch }
  if (p.hourStem) { sl['시간'] = p.hourStem; sl['시지'] = p.hourBranch! }
  const totals: Record<Group, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 }
  const gs: Record<string, Group> = {}
  for (const [k, v] of Object.entries(sl)) {
    const g = group(dm, k.endsWith('간') ? v : MAIN[v]); gs[k] = g; totals[g] += (POSITION_WEIGHT as any)[k]
  }
  const support = totals.비겁 + totals.인성
  const total = Object.values(POSITION_WEIGHT).reduce((a, b) => a + b, 0) - (p.hourStem ? 0 : 25)
  const grade = support < 45 ? '신약' : support < 60 ? '중화신약' : support < 75 ? '중화신강' : '신강'
  const strong = support >= 60
  // 격: 월지 지장간 중 (연/월/시) 천간에 투출한 것 (본기→중기→여기 순), 없으면 본기
  const top = [p.yearStem, p.monthStem, p.hourStem].filter(Boolean) as string[]
  const hid = HID[p.monthBranch]
  const hit = hid.find((h) => top.includes(h))
  const pick = hit ?? hid[0]
  const gyeok = tenGod(dm, pick) + '격'
  // 억부: 신강 쪽이면 비겁 vs 인성, 신약 쪽이면 관성·재성·식상 중 상위 2개를 비교. 격차 ≤3이면 월지 그룹(없으면 힘의 우열)으로 결정
  const cand: Group[] = strong ? ['비겁', '인성'] : (['관성', '재성', '식상'] as Group[]).sort((a, b) => totals[b] - totals[a]).slice(0, 2)
  const gap = Math.abs(totals[cand[0]] - totals[cand[1]])
  const border = gap <= 3
  let heavy: Group, borderBy = ''
  if (border) {
    const mg = gs['월지']
    if (cand.includes(mg)) { heavy = mg; borderBy = '태어난 달' } else { heavy = totals[cand[0]] >= totals[cand[1]] ? cand[0] : cand[1]; borderBy = '힘의 우열' }
  } else heavy = totals[cand[0]] > totals[cand[1]] ? cand[0] : cand[1]
  const NAME: Record<string, string> = { '신강비겁': '군비쟁재격', '신강인성': '인중용재격', '신약관성': '관살태과격', '신약재성': '재중용비격', '신약식상': '진상관용인격' }
  const eokName = NAME[(strong ? '신강' : '신약') + heavy] ?? '미분류'
  const e = EOK_TABLE[eokName] ?? { yong: [], hee: [] }
  // 조후: 巳午未(조열 → 수·금), 亥子丑(한습 → 화·목)월만. 급하면 조후가 억부보다 먼저(정답지 헤드라인 용신).
  const johuKind = '사오미'.includes(p.monthBranch) ? '조열' : '해자축'.includes(p.monthBranch) ? '한습' : null
  const johuEls = johuKind === '조열' ? ['수', '금'] : johuKind === '한습' ? ['화', '목'] : []
  let johuW = 0
  for (const [k, v] of Object.entries(sl)) {
    const el = ELEMS[EL[k.endsWith('간') ? v : MAIN[v]]]
    if (johuEls.includes(el)) johuW += (POSITION_WEIGHT as any)[k]
  }
  const johuShare = johuKind ? johuW / total : 1
  const johuUrgent = !!johuKind && johuShare < JOHU_URGENT_BELOW
  const eokEls = e.yong.map((g) => ELEMS[(EL[dm] + GROUPS.indexOf(g)) % 5])
  const headline = johuUrgent ? { source: '조후' as const, elements: johuEls } : { source: '억부' as const, elements: eokEls }
  const outlier = support >= 100 ? '외격(종왕·종강) 의심' : support <= 30 ? '외격(종재·종관·종아) 의심' : null
  return { support, against: total - support, grade, strong, totals, gyeok, gyeokTuchul: !!hit, gyeokYong: GYEOK_YONG[gyeok] ?? null, eokName, eokYong: e.yong, eokHee: e.hee, border, borderGap: gap, borderBy, outlier,
    johu: { applicable: !!johuKind, kind: johuKind, urgent: johuUrgent, elements: johuEls, share: Math.round(johuShare * 1000) / 1000 }, headline }
}

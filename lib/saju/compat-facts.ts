// 궁합 v2 — 두 사람 교차 팩트 + 점수 (결정론). LLM 은 이 값을 문장으로 풀기만 한다.
// 입력: calculateSaju() 결과 두 개 (DB 에 저장된 예전 saju_data 가 아니라, 생성 시점에 다시 계산한 값을 넣는다).
import { tenGod, group, type Group } from './expert-core'
import { TEN_GODS_ENGLISH, STEM_PRONUNCIATION, BRANCH_PRONUNCIATION } from './constants'
import { buildRomanceFacts } from './romance'

export type Gender = 'male' | 'female'
export type RelationshipType = 'crush' | 'talking' | 'dating' | 'married' | 'ex'
export interface Person { name: string; gender: Gender; birthYear: number; saju: any }

const MAIN: Record<string, string> = { 자: '계', 축: '기', 인: '갑', 묘: '을', 진: '무', 사: '병', 오: '정', 미: '기', 신: '경', 유: '신', 술: '무', 해: '임' }
const EL_OF_STEM: Record<string, string> = { 갑: 'Wood', 을: 'Wood', 병: 'Fire', 정: 'Fire', 무: 'Earth', 기: 'Earth', 경: 'Metal', 신: 'Metal', 임: 'Water', 계: 'Water' }
const REP: Record<string, string> = { wood: '갑', fire: '병', earth: '무', metal: '경', water: '임' }
const ROMAN = (c: string): string => (STEM_PRONUNCIATION as any)[c]?.split('-')[0] ?? (BRANCH_PRONUNCIATION as any)[c] ?? c
const STEM_POLARITY = (s: string) => ('갑병무경임'.includes(s) ? 'Yang' : 'Yin')

const pair = (t: string[], a: string, b: string) => t.includes(a + b) || t.includes(b + a)
const STEM_HAP: Record<string, string> = { 갑기: 'Earth', 을경: 'Metal', 병신: 'Water', 정임: 'Wood', 무계: 'Fire' }
const STEM_CHUNG = ['갑경', '을신', '병임', '정계']
const YUKHAP = ['자축', '인해', '묘술', '진유', '사신', '오미']
const CHUNG = ['자오', '축미', '인신', '묘유', '진술', '사해']
const WONJIN = ['자미', '축오', '인유', '묘신', '진해', '사술']
const HAE = ['자미', '축오', '인사', '묘진', '신해', '유술']
const PA = ['자유', '축진', '인해', '묘오', '사신', '술미']
const HYEONG = ['인사', '사신', '인신', '축술', '술미', '축미', '자묘']
const SELF_HYEONG = ['진', '오', '유', '해']
const GWIMUN = ['자유', '축오', '인미', '묘신', '진해', '사술']
const SAMHAP: [string[], string][] = [[['신', '자', '진'], '자'], [['해', '묘', '미'], '묘'], [['인', '오', '술'], '오'], [['사', '유', '축'], '유']]
const DOHWA_OF: Record<string, string> = { 신: '유', 자: '유', 진: '유', 인: '묘', 오: '묘', 술: '묘', 사: '오', 유: '오', 축: '오', 해: '자', 묘: '자', 미: '자' }

type BranchRel = 'Combination' | 'Half Harmony' | 'Clash' | 'Penalty' | 'Self-Penalty' | 'Resentment' | 'Harm' | 'Break' | 'Ghost Gate'
const REL_KO: Record<BranchRel, string> = { Combination: '육합', 'Half Harmony': '반합', Clash: '충', Penalty: '형', 'Self-Penalty': '자형', Resentment: '원진', Harm: '해', Break: '파', 'Ghost Gate': '귀문' }
const REL_ROMAN: Record<BranchRel, string> = { Combination: 'Hap', 'Half Harmony': 'Banhap', Clash: 'Chung', Penalty: 'Hyeong', 'Self-Penalty': 'Ja-Hyeong', Resentment: 'Wonjin', Harm: 'Hae', Break: 'Pa', 'Ghost Gate': 'Gwimun' }
export const GOOD_REL: BranchRel[] = ['Combination', 'Half Harmony']

export function branchRelations(a: string, b: string): BranchRel[] {
  const out: BranchRel[] = []
  if (pair(YUKHAP, a, b)) out.push('Combination')
  for (const [grp, wang] of SAMHAP) if (a !== b && grp.includes(a) && grp.includes(b) && (a === wang || b === wang)) out.push('Half Harmony')
  if (pair(CHUNG, a, b)) out.push('Clash')
  if (pair(HYEONG, a, b)) out.push('Penalty')
  if (a === b && SELF_HYEONG.includes(a)) out.push('Self-Penalty')
  if (pair(WONJIN, a, b)) out.push('Resentment')
  else if (pair(HAE, a, b)) out.push('Harm')
  if (pair(PA, a, b)) out.push('Break')
  if (pair(GWIMUN, a, b)) out.push('Ghost Gate')
  return out
}

const POS = ['연', '월', '일', '시'] as const
const POS_EN: Record<string, string> = { 연: 'Year', 월: 'Month', 일: 'Day', 시: 'Hour' }
const PALACE_MEANING: Record<string, string> = {
  'Day-Day': 'your two spouse palaces (the core of the relationship)',
  'Month-Month': 'your daily-life and home rhythms',
  'Year-Year': 'your two families of origin',
  'Hour-Hour': 'your shared future and children',
}

function pillars(s: any) {
  const k = (p: any): [string, string] | null => (p?.fullNameKorean ? [p.fullNameKorean[0], p.fullNameKorean[1]] : null)
  const o: Record<string, [string, string] | null> = { 연: k(s.yearPillar), 월: k(s.monthPillar), 일: k(s.dayPillar), 시: k(s.hourPillar) }
  return o
}

const share = (bal: Record<string, number>) => {
  const tot = Object.values(bal).reduce((a, b) => a + b, 0) || 1
  return Object.fromEntries(Object.entries(bal).map(([k, v]) => [k, v / tot])) as Record<string, number>
}
// 이 사람에게 도움이 되는(희·용) 십성 그룹 비율: 상대 vs 본인
function favShare(dm: string, favGroups: Group[], bal: Record<string, number>) {
  const sh = share(bal)
  return Object.entries(sh).reduce((acc, [el, v]) => acc + (favGroups.includes(group(dm, REP[el])) ? v : 0), 0)
}
const GROUP_EN: Record<Group, string> = { 비겁: 'Companion (peer) energy', 식상: 'Expression energy', 재성: 'Wealth energy', 관성: 'Officer (structure) energy', 인성: 'Resource (support) energy' }

// 체온: -1(차갑고 습함) ~ +1(뜨겁고 메마름)
const SEASON_T: Record<string, number> = { 사: 0.5, 오: 0.6, 미: 0.45, 해: -0.5, 자: -0.6, 축: -0.45, 인: -0.1, 묘: 0, 진: 0.05, 신: 0, 유: -0.05, 술: 0.1 }
function temperature(s: any) {
  const mb = s.monthPillar.fullNameKorean[1]
  const sh = share(s.elementBalanceWithHiddenStems)
  let t = SEASON_T[mb] * 0.6 + (sh.fire - sh.water) * 1.2
  const k = s.expert?.johu?.kind
  if (k === '조열') t = Math.max(t, 0.6)
  if (k === '한습') t = Math.min(t, -0.6)
  t = Math.max(-1, Math.min(1, t))
  const label = t >= 0.45 ? 'hot and dry' : t >= 0.15 ? 'warm' : t > -0.15 ? 'mild' : t > -0.45 ? 'cool' : 'cold and damp'
  return { t: Math.round(t * 100) / 100, label, season: seasonOf(mb) }
}
function seasonOf(b: string) { return '인묘진'.includes(b) ? 'spring' : '사오미'.includes(b) ? 'summer' : '신유술'.includes(b) ? 'autumn' : 'winter' }

function attractionSinsal(s: any) {
  const out: { name: string; pos: string }[] = []
  for (const [slot, names] of Object.entries(s.expertSinsal || {})) for (const n of names as string[]) if (n === '도화살' || n === '홍염살') out.push({ name: n === '도화살' ? 'Peach Blossom (Dohwa)' : 'Red Glow (Hongyeom)', pos: (POS_EN[slot] ?? slot) + ' Pillar' })
  return out
}

type Reason = { text: string; points: number }

export function buildCompatFacts(A: Person, B: Person, opts: { reportYear: number; relationship: RelationshipType }) {
  const pa = pillars(A.saju), pb = pillars(B.saju)
  const dmA = pa.일![0], dmB = pb.일![0]
  const hourKnown = { [A.name]: !!pa.시, [B.name]: !!pb.시 }

  // 1. 일간 관계
  const stemKey = Object.keys(STEM_HAP).find((k) => pair([k], dmA, dmB))
  const dayStem = {
    combination: stemKey ? { forms: STEM_HAP[stemKey] } : null,
    clash: pair(STEM_CHUNG, dmA, dmB),
    flow: (() => {
      const ga = group(dmA, dmB) // A 기준 B
      if (ga === '비겁') return 'same element'
      if (ga === '인성') return `${B.name} feeds ${A.name}` // B 가 A 를 생
      if (ga === '식상') return `${A.name} feeds ${B.name}`
      if (ga === '관성') return `${B.name} shapes/controls ${A.name}`
      return `${A.name} shapes/controls ${B.name}`
    })(),
    A: `${STEM_POLARITY(dmA)} ${EL_OF_STEM[dmA]} (${ROMAN(dmA)})`, B: `${STEM_POLARITY(dmB)} ${EL_OF_STEM[dmB]} (${ROMAN(dmB)})`,
  }

  // 2. 서로가 보는 십성
  const tg = (dm: string, x: string) => { const t = tenGod(dm, x); return `${TEN_GODS_ENGLISH[t] ?? t}` }
  const seen = {
    [`${A.name} sees ${B.name} as`]: tg(dmA, dmB),
    [`${B.name} sees ${A.name} as`]: tg(dmB, dmA),
    [`${B.name}'s Day Branch, to ${A.name}`]: tg(dmA, MAIN[pb.일![1]]),
    [`${A.name}'s Day Branch, to ${B.name}`]: tg(dmB, MAIN[pa.일![1]]),
  }

  // 3. 지지 교차 관계 (4x4)
  const branchLinks: { a: string; b: string; key: string; rels: BranchRel[]; en: string; meaning?: string }[] = []
  for (const x of POS) for (const y of POS) {
    const bx = pa[x]?.[1], by = pb[y]?.[1]
    if (!bx || !by) continue
    const rels = branchRelations(bx, by)
    if (!rels.length) continue
    const key = `${POS_EN[x]}-${POS_EN[y]}`
    branchLinks.push({
      a: `${A.name} ${POS_EN[x]}`, b: `${B.name} ${POS_EN[y]}`, key, rels,
      en: `${A.name}'s ${POS_EN[x]} Branch (${ROMAN(bx)}) and ${B.name}'s ${POS_EN[y]} Branch (${ROMAN(by)}): ` + rels.map((r) => `${ROMAN(bx)}-${ROMAN(by)} ${REL_ROMAN[r]} (${r})`).join(', '),
      meaning: PALACE_MEANING[key],
    })
  }
  const dayDay = branchLinks.find((l) => l.key === 'Day-Day')?.rels ?? []
  const monthMonth = branchLinks.find((l) => l.key === 'Month-Month')?.rels ?? []
  const yearYear = branchLinks.find((l) => l.key === 'Year-Year')?.rels ?? []

  // 4. 교차 공망
  const gmA: string[] = A.saju.gongmang || [], gmB: string[] = B.saju.gongmang || []
  const voids: string[] = []
  if (gmB.includes(pa.일![1])) voids.push(`${A.name}'s Day Branch (${ROMAN(pa.일![1])}) falls in ${B.name}'s Void (Gongmang): ${B.name} can feel ${A.name} is hard to fully hold on to`)
  if (gmA.includes(pb.일![1])) voids.push(`${B.name}'s Day Branch (${ROMAN(pb.일![1])}) falls in ${A.name}'s Void (Gongmang): ${A.name} can feel ${B.name} is hard to fully hold on to`)

  // 5. 상대 안의 내 배우자성 (이성: 남=재성, 여=관성 / 동성: 재성·관성 모두 '끌림 별')
  const sameSex = A.gender === B.gender
  const starGroups = (p: Person): Group[] => (sameSex ? ['재성', '관성'] : p.gender === 'male' ? ['재성'] : ['관성'])
  function partnerStar(me: Person, dmMe: string, other: Record<string, [string, string] | null>, otherName: string) {
    const gs = starGroups(me)
    const dayHits: string[] = []; const elsewhere: string[] = []
    const o = other
    if (gs.includes(group(dmMe, o.일![0]))) dayHits.push(`${otherName}'s Day Master`)
    if (gs.includes(group(dmMe, MAIN[o.일![1]]))) dayHits.push(`${otherName}'s Day Branch`)
    for (const p of ['연', '월', '시'] as const) {
      if (!o[p]) continue
      if (gs.includes(group(dmMe, o[p]![0]))) elsewhere.push(`${otherName}'s ${POS_EN[p]} Stem`)
      if (gs.includes(group(dmMe, MAIN[o[p]![1]]))) elsewhere.push(`${otherName}'s ${POS_EN[p]} Branch`)
    }
    return { star: sameSex ? 'attraction stars (Wealth/Officer)' : gs[0] === '재성' ? 'spouse star (Wealth)' : 'spouse star (Officer)', inDayPillar: dayHits, elsewhere }
  }
  const starA = partnerStar(A, dmA, pb, B.name), starB = partnerStar(B, dmB, pa, A.name)

  // 6. 도화·홍염
  const sinA = attractionSinsal(A.saju), sinB = attractionSinsal(B.saju)
  const crossDohwa: string[] = []
  const dohwaTargets = (p: Record<string, [string, string] | null>) => new Set([p.연?.[1], p.일?.[1]].filter(Boolean).map((b) => DOHWA_OF[b as string]))
  const tA = dohwaTargets(pa), tB = dohwaTargets(pb)
  for (const p of POS) { const b = pb[p]?.[1]; if (b && tA.has(b)) crossDohwa.push(`${B.name}'s ${POS_EN[p]} Branch (${ROMAN(b)}) sits on ${A.name}'s Peach Blossom spot: ${A.name} finds ${B.name} hard to look away from`) }
  for (const p of POS) { const b = pa[p]?.[1]; if (b && tB.has(b)) crossDohwa.push(`${A.name}'s ${POS_EN[p]} Branch (${ROMAN(b)}) sits on ${B.name}'s Peach Blossom spot: ${B.name} finds ${A.name} hard to look away from`) }

  // 7. 오행·용신 보완
  const favA: Group[] = A.saju.decadeFortune?.favorableTenGodGroups ?? [...(A.saju.expert?.eokYong ?? []), ...(A.saju.expert?.eokHee ?? [])]
  const favB: Group[] = B.saju.decadeFortune?.favorableTenGodGroups ?? [...(B.saju.expert?.eokYong ?? []), ...(B.saju.expert?.eokHee ?? [])]
  const balA = A.saju.elementBalanceWithHiddenStems, balB = B.saju.elementBalanceWithHiddenStems
  const gainA = favShare(dmA, favA, balB) - favShare(dmA, favA, balA)
  const gainB = favShare(dmB, favB, balA) - favShare(dmB, favB, balB)
  const domA = Object.entries(balA as Record<string, number>).sort((x, y) => y[1] - x[1])[0][0]
  const domB = Object.entries(balB as Record<string, number>).sort((x, y) => y[1] - x[1])[0][0]
  const sharedDominantHurts = domA === domB && (!favA.includes(group(dmA, REP[domA])) || !favB.includes(group(dmB, REP[domB])))
  const GRADE_EN: Record<string, string> = { 신강: 'Strong', 중화신강: 'Balanced-Strong', 중화신약: 'Balanced-Weak', 신약: 'Weak' }
  const strength = (p: Person) => ({ grade: GRADE_EN[p.saju.expert?.grade] ?? p.saju.expert?.grade, score: p.saju.expert?.support, needs: (p.saju.decadeFortune?.favorableTenGodGroups ?? []).map((g: Group) => GROUP_EN[g]) })

  // 8. 조후
  const tmpA = temperature(A.saju), tmpB = temperature(B.saju)

  // 9. 함께 보는 시기
  // 시주를 모르면 buildRomanceFacts 가 시주를 읽다 실패하므로, 시주 자리에 일주를 임시로 넣지 않고 빈 값을 채운다
  const safeRom = (p: Person) => {
    const s = p.saju.hourPillar ? p.saju : { ...p.saju, hourPillar: { fullNameKorean: '  ' } }
    try { return buildRomanceFacts(s, p.gender, opts.reportYear, p.birthYear) } catch { return null }
  }
  const romA = safeRom(A), romB = safeRom(B)
  const neutral = (y: number) => ({ year: y, ganziEn: '', tone: 'unknown', touchesSpousePalaceEn: [], spouseStarShown: 0 })
  const ylA: any[] = romA?.yearLuck ?? [0, 1, 2].map((k) => neutral(opts.reportYear + k))
  const ylB: any[] = romB?.yearLuck ?? [0, 1, 2].map((k) => neutral(opts.reportYear + k))
  const timing = ylA.map((ya: any, i: number) => {
    const yb = ylB[i]
    const both = ya.tone === 'opportunity' && yb.tone === 'opportunity'
    const caution = [ya, yb].filter((y: any) => y.tone === 'caution' || y.tone === 'mixed').length
    return {
      year: ya.year, ganziEn: ya.ganziEn,
      [A.name]: { tone: ya.tone, spousePalace: ya.touchesSpousePalaceEn, spouseStar: ya.spouseStarShown },
      [B.name]: { tone: yb.tone, spousePalace: yb.touchesSpousePalaceEn, spouseStar: yb.spouseStarShown },
      together: both ? 'good for both — a year to take a step together' : caution === 2 ? 'both feel pressure — keep decisions small' : caution === 1 ? 'one of you is under more strain — the other leads gently' : 'steady',
    }
  })
  const mt = (p: Person) => {
    const m = p.saju.marriageTiming
    if (!m) return null
    const y = (x: any) => (x ? { year: x.year, score: x.score } : null)
    return { bestMeetingYear: y(m.bestMeetingYear), bestMarriageYear: y(m.bestMarriageYear), spouseStarCount: m.spouseStarCount }
  }

  // 자녀 (여: 식상, 남: 관성) 개수 — 원국 천간 + 지지 본기
  const childCount = (p: Person, ps: Record<string, [string, string] | null>, dm: string) => {
    const g: Group = p.gender === 'female' ? '식상' : '관성'
    let n = 0
    for (const k of POS) { const x = ps[k]; if (!x) continue; if (k !== '일' && group(dm, x[0]) === g) n++; if (group(dm, MAIN[x[1]]) === g) n++ }
    return n
  }

  // ---------------- 점수 ----------------
  const attr: Reason[] = [], stab: Reason[] = [], bal: Reason[] = [], clim: Reason[] = []
  if (dayStem.combination) attr.push({ text: `Day Masters combine (${ROMAN(dmA)}-${ROMAN(dmB)} Hap)`, points: 20 })
  if (dayStem.clash) attr.push({ text: `Day Masters clash (${ROMAN(dmA)}-${ROMAN(dmB)} Chung)`, points: -5 })
  if (dayDay.includes('Combination')) attr.push({ text: 'Day Branches combine (spouse palaces lock together)', points: 15 })
  if (dayDay.includes('Half Harmony')) attr.push({ text: 'Day Branches form a half harmony', points: 8 })
  if (dayDay.includes('Resentment') || dayDay.includes('Ghost Gate')) attr.push({ text: 'Day Branches carry Resentment/Ghost Gate tension', points: -10 })
  for (const [me, st] of [[A, starA], [B, starB]] as const) {
    if (st.inDayPillar.length) attr.push({ text: `${me.name}'s ${st.star} appears in ${st.inDayPillar.join(' and ')}`, points: 10 })
    else if (st.elsewhere.length) attr.push({ text: `${me.name}'s ${st.star} appears elsewhere in the partner's chart`, points: 3 })
  }
  if (crossDohwa.length) attr.push({ text: 'Peach Blossom cross-hit', points: Math.min(12, 6 * crossDohwa.length) })
  const holders = [sinA.length ? A.name : null, sinB.length ? B.name : null].filter(Boolean)
  if (holders.length) attr.push({ text: `${holders.join(' and ')} carr${holders.length > 1 ? 'y' : 'ies'} Peach Blossom/Red Glow charm`, points: 4 * holders.length })

  if (dayDay.includes('Clash')) stab.push({ text: 'Day Branches clash', points: -25 })
  if (dayDay.includes('Penalty') || dayDay.includes('Self-Penalty')) stab.push({ text: 'Day Branches carry a Penalty (friction in daily habits)', points: -8 })
  if (dayDay.includes('Resentment')) stab.push({ text: 'Day Branches carry Resentment', points: -8 })
  if (dayDay.includes('Ghost Gate')) stab.push({ text: 'Day Branches carry Ghost Gate (oversensitivity under stress)', points: -6 })
  if (dayDay.includes('Harm') || dayDay.includes('Break')) stab.push({ text: 'Day Branches carry Harm/Break', points: -6 })
  for (const v of voids) stab.push({ text: v.split(':')[0], points: -6 })
  if (monthMonth.includes('Clash')) stab.push({ text: 'Month Branches clash (different home rhythms)', points: -8 })
  if (monthMonth.some((r) => GOOD_REL.includes(r))) stab.push({ text: 'Month Branches harmonize (daily rhythms fit)', points: 5 })
  if (yearYear.some((r) => ['Clash', 'Penalty'].includes(r))) stab.push({ text: 'Year Branches clash/penalty (families of origin differ)', points: -5 })

  const g2 = (x: number) => Math.round(x * 100) / 100
  bal.push({ text: `${B.name} supplies what ${A.name} needs (net ${g2(gainA) >= 0 ? '+' : ''}${g2(gainA)})`, points: Math.round(37.5 * gainA) })
  bal.push({ text: `${A.name} supplies what ${B.name} needs (net ${g2(gainB) >= 0 ? '+' : ''}${g2(gainB)})`, points: Math.round(37.5 * gainB) })
  if (sharedDominantHurts) bal.push({ text: `Both lean heavily on ${domA[0].toUpperCase() + domA.slice(1)}, which at least one of you needs less of`, points: -20 })

  const prod = tmpA.t * tmpB.t
  if (prod > 0) clim.push({ text: `Both charts run ${tmpA.t > 0 ? 'hot' : 'cold'} (${tmpA.label} + ${tmpB.label})`, points: -Math.round(40 * Math.min(1, prod * 2.5)) })
  else if (prod < 0) clim.push({ text: `One runs warm, one runs cool (${tmpA.label} + ${tmpB.label}) — you balance each other's temperature`, points: Math.round(30 * Math.min(1, -prod * 2.5)) })

  const sum = (base: number, rs: Reason[], lo = 0) => Math.max(lo, Math.min(100, base + rs.reduce((a, r) => a + r.points, 0)))
  const scores = {
    attraction: { score: sum(30, attr), reasons: attr },
    stability: { score: sum(85, stab, 20), reasons: stab },
    balance: { score: sum(50, bal, 5), reasons: bal },
    climate: { score: sum(70, clim, 10), reasons: clim },
  }
  const weighted = 0.3 * scores.attraction.score + 0.3 * scores.stability.score + 0.25 * scores.balance.score + 0.15 * scores.climate.score
  // 총점: 55~95 로 묶는다 (설계안 4장). 표본 D(전연인)=74 로 경쟁사와 같은 값.
  const total = Math.max(55, Math.min(95, Math.round(40 + weighted * 0.6)))
  const hiA = scores.attraction.score >= 60, hiS = scores.stability.score >= 62
  const matchType = hiA && hiS ? 'Soulmate Match' : hiA ? 'Magnetic Match' : hiS ? 'Steady Match' : 'Growth Match'

  return {
    people: {
      [A.name]: { gender: A.gender, dayPillar: `${ROMAN(pa.일![0])}-${ROMAN(pa.일![1])}`, dayMaster: dayStem.A, strength: strength(A), temperature: tmpA, attractionSinsal: sinA, hourKnown: hourKnown[A.name], marriageTiming: mt(A), childrenStars: childCount(A, pa, dmA) },
      [B.name]: { gender: B.gender, dayPillar: `${ROMAN(pb.일![0])}-${ROMAN(pb.일![1])}`, dayMaster: dayStem.B, strength: strength(B), temperature: tmpB, attractionSinsal: sinB, hourKnown: hourKnown[B.name], marriageTiming: mt(B), childrenStars: childCount(B, pb, dmB) },
    },
    relationship: opts.relationship,
    dayStem, seenAs: seen, branchLinks, voids,
    partnerStars: { [A.name]: starA, [B.name]: starB },
    crossDohwa,
    elementComplement: { [`${A.name} gain from ${B.name}`]: g2(gainA), [`${B.name} gain from ${A.name}`]: g2(gainB), dominant: { [A.name]: domA, [B.name]: domB }, sharedDominantHurts },
    timing, scores, total, matchType,
    allowedRelationLabels: branchLinks.flatMap((l) => l.rels.map((r) => `${l.en.split(':')[0]} ${REL_ROMAN[r]}`)),
    _ko: { dayDay: dayDay.map((r) => REL_KO[r]), monthMonth: monthMonth.map((r) => REL_KO[r]), yearYear: yearYear.map((r) => REL_KO[r]) },
  }
}

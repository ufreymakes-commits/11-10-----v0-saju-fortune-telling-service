// 연애/결혼 결정론 팩트 (유료 리포트 전용). LLM은 이 값을 문장으로 풀기만 한다.
// 사용처: generate-paid-report 에서 saju_data 와 현재 연도로 호출. (무료 리포트/Stage 1 에는 넣지 않는다)
import { tenGod, group } from './expert-core'
import { STEM_PRONUNCIATION, BRANCH_PRONUNCIATION, TEN_GODS_ENGLISH, ELEMENT_ENGLISH, STEM_TO_ELEMENT, ELEMENTS } from './constants'

const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']
const MAIN: Record<string, string> = { 자: '계', 축: '기', 인: '갑', 묘: '을', 진: '무', 사: '병', 오: '정', 미: '기', 신: '경', 유: '신', 술: '무', 해: '임' }
const SIXTY = (i: number) => STEMS[((i % 10) + 10) % 10] + BRANCHES[((i % 12) + 12) % 12]
// 연도 → 간지 (1984 = 갑자)
export const yearGanzi = (y: number) => SIXTY(y - 1984)
const ANIMAL: Record<string, string> = { 자: 'Rat', 축: 'Ox', 인: 'Tiger', 묘: 'Rabbit', 진: 'Dragon', 사: 'Snake', 오: 'Horse', 미: 'Goat', 신: 'Monkey', 유: 'Rooster', 술: 'Dog', 해: 'Pig' }
const STEM_EL_EN: Record<string, string> = { 갑: 'Wood', 을: 'Wood', 병: 'Fire', 정: 'Fire', 무: 'Earth', 기: 'Earth', 경: 'Metal', 신: 'Metal', 임: 'Water', 계: 'Water' }
/** 예: 2026 -> "Fire Horse" */
export const yearNickname = (y: number) => { const g = yearGanzi(y); return `${STEM_EL_EN[g[0]]} ${ANIMAL[g[1]]}` }

const STEM_HAP: [string, string][] = [['갑', '기'], ['을', '경'], ['병', '신'], ['정', '임'], ['무', '계']]
const STEM_CHUNG: [string, string][] = [['갑', '경'], ['을', '신'], ['병', '임'], ['정', '계']]
const YUKHAP: [string, string][] = [['자', '축'], ['인', '해'], ['묘', '술'], ['진', '유'], ['사', '신'], ['오', '미']]
const CHUNG: [string, string][] = [['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해']]
const WONJIN: [string, string][] = [['자', '미'], ['축', '오'], ['인', '유'], ['묘', '신'], ['진', '해'], ['사', '술']]
const HAE: [string, string][] = [['자', '미'], ['축', '오'], ['인', '사'], ['묘', '진'], ['신', '해'], ['유', '술']]
const PA: [string, string][] = [['자', '유'], ['축', '진'], ['인', '해'], ['묘', '오'], ['사', '신'], ['술', '미']]
const HYEONG: [string, string, string][] = [['인', '사', '지세지형'], ['사', '신', '지세지형'], ['인', '신', '지세지형'], ['축', '술', '무은지형'], ['술', '미', '무은지형'], ['축', '미', '무은지형'], ['자', '묘', '무례지형']]
const SELF_HYEONG = ['진', '오', '유', '해']
const SAMHAP: [string[], string, string][] = [[['신', '자', '진'], '수', '자'], [['해', '묘', '미'], '목', '묘'], [['인', '오', '술'], '화', '오'], [['사', '유', '축'], '금', '유']]

const inPair = (t: [string, string][], a: string, b: string) => t.some(([x, y]) => (x === a && y === b) || (x === b && y === a))

export type Rel = { type: string; with: string; label: string; polarity: 'good' | 'bad' | 'neutral'; en?: string }

// 라벨(한글) → 영문 로마자 라벨. 유료 리포트는 한글/한자 출력 금지라서 LLM 이 그대로 쓸 수 있게 미리 만들어 둔다.
const ROMAN = (c: string): string => (STEM_PRONUNCIATION as any)[c]?.split('-')[0] ?? (BRANCH_PRONUNCIATION as any)[c] ?? c
const TYPE_EN: Record<string, string> = {
  천간합: 'Hap (Heavenly Stem Combination)', 천간충: 'Chung (Heavenly Stem Clash)', 육합: 'Hap (Branch Combination)', 지충: 'Chung (Branch Clash)',
  원진: 'Wonjin (Resentment)', 해: 'Hae (Harm)', 파: 'Pa (Break)', 형: 'Hyeong (Penalty)', 자형: 'Ja-Hyeong (Self-Penalty)', 삼합: 'Samhap (Triple Harmony)', 반합: 'Banhap (Half Harmony)',
}
function enLabel(r: Rel): string {
  const chars = [...r.label.split(/합|충|원진|해|파|형|삼합|반합|지세지형|무은지형|무례지형|자형/)[0]]
  const names = chars.map(ROMAN).join('-')
  return `${names} ${TYPE_EN[r.type] ?? r.type}`
}

/** 세운(또는 대운) 한 글자쌍(천간, 지지)이 원국 일간/각 지지와 맺는 관계 */
export function relationsOf(stem: string, branch: string, natal: { stems: Record<string, string>; branches: Record<string, string> }) {
  const out: Rel[] = []
  // 천간: 일간 우선, 그 외 연/월/시간도 표시
  for (const [pos, s] of Object.entries(natal.stems)) {
    if (inPair(STEM_HAP, stem, s)) out.push({ type: '천간합', with: pos, label: `${stem}${s}합`, polarity: 'good' })
    if (inPair(STEM_CHUNG, stem, s)) out.push({ type: '천간충', with: pos, label: `${stem}${s}충`, polarity: 'bad' })
  }
  for (const [pos, b] of Object.entries(natal.branches)) {
    if (inPair(YUKHAP, branch, b)) out.push({ type: '육합', with: pos, label: `${branch}${b}합`, polarity: 'good' })
    if (inPair(CHUNG, branch, b)) out.push({ type: '지충', with: pos, label: `${branch}${b}충`, polarity: 'bad' })
    if (inPair(WONJIN, branch, b)) out.push({ type: '원진', with: pos, label: `${branch}${b}원진`, polarity: 'bad' })
    else if (inPair(HAE, branch, b)) out.push({ type: '해', with: pos, label: `${branch}${b}해`, polarity: 'bad' })
    if (inPair(PA, branch, b)) out.push({ type: '파', with: pos, label: `${branch}${b}파`, polarity: 'bad' })
    for (const [x, y, nm] of HYEONG) if ((x === branch && y === b) || (x === b && y === branch)) out.push({ type: '형', with: pos, label: `${branch}${b}${nm}`, polarity: 'bad' })
    if (SELF_HYEONG.includes(branch) && branch === b) out.push({ type: '자형', with: pos, label: `${branch}${b}자형`, polarity: 'bad' })
  }
  // 삼합/반합 (반합은 왕지 포함 시만): 세운 지지 + 원국 지지
  const nb = Object.values(natal.branches)
  for (const [grp, el, wang] of SAMHAP) {
    if (!grp.includes(branch)) continue
    const present = grp.filter((g) => g === branch || nb.includes(g))
    if (present.length === 3) out.push({ type: '삼합', with: '원국', label: `${grp.join('')}삼합 ${el}국`, polarity: 'good' })
    else if (present.length === 2 && present.includes(wang) && nb.some((g) => grp.includes(g) && g !== branch)) {
      out.push({ type: '반합', with: '원국', label: `${present.join('')}반합 ${el}`, polarity: 'good' })
    }
  }
  // 같은 라벨(예: 연간·시간 임수와 동시에 병임충)은 하나로 합치고 위치를 모은다
  const merged: Rel[] = []
  for (const r of out) {
    const hit = merged.find((m) => m.label === r.label && m.type === r.type)
    if (hit) { if (!hit.with.split('·').includes(r.with)) hit.with += '·' + r.with } else merged.push({ ...r })
  }
  merged.forEach((r) => { r.en = enLabel(r) })
  return merged
}

const SPOUSE_GROUP = { female: '관성', male: '재성' } as const

export function buildRomanceFacts(saju: any, gender: 'male' | 'female', nowYear: number, birthYear?: number) {
  const dm: string = saju.dayPillar.fullNameKorean[0]
  const d = (p: any) => [p.fullNameKorean[0], p.fullNameKorean[1]]
  const [ys, yb] = d(saju.yearPillar), [ms, mb] = d(saju.monthPillar), [ds, db] = d(saju.dayPillar), [hs, hb] = d(saju.hourPillar)
  const natal = {
    stems: { 연간: ys, 월간: ms, 일간: ds, 시간: hs } as Record<string, string>,
    branches: { 연지: yb, 월지: mb, 일지: db, 시지: hb } as Record<string, string>,
  }
  const spouseGroup = SPOUSE_GROUP[gender]
  const grpOf = (x: string) => group(dm, x)

  // 배우자궁
  const palaceStar = (saju.twelveStars || []).find((t: any) => t.position === '일지')?.star ?? null
  const palaceNatalOut = (['연지', '월지', '시지'] as const)
    .map((pos) => ({ pos, rels: relationsOf('', db, { stems: {}, branches: { [pos]: natal.branches[pos] } }).map((r) => ({ label: r.label, en: r.en, polarity: r.polarity })) }))
    .filter((x) => x.rels.length)
  const spouseEl = (ELEMENTS as readonly string[])[((ELEMENTS as readonly string[]).indexOf((STEM_TO_ELEMENT as any)[dm]) + (gender === 'female' ? 3 : 2)) % 5]

  // 연애 관련 신살 (정답지 표기 기준)
  const ROMANCE_SINSAL = ['도화살', '홍염살', '의처의부살', '백호살', '음욕살', '고신살', '과숙살', '나체도화', '여연살', '남연살', '음양살', '귀문관살', '원진살']
  const sinsal: Record<string, string[]> = {}
  for (const [slot, names] of Object.entries(saju.expertSinsal || {})) {
    const hit = (names as string[]).filter((n) => ROMANCE_SINSAL.includes(n))
    if (hit.length) sinsal[slot] = hit
  }

  // 현재 대운
  let curDaewoon: any = null
  const decs = saju.decadeFortune?.decades
  if (decs) curDaewoon = decs.find((x: any) => x.startYear <= nowYear && nowYear < x.endYear) || null
  else if (birthYear) curDaewoon = (saju.daewoon || []).map((x: any) => ({ ...x, ganzi: x.fullName })).find((x: any) => birthYear + x.startAge <= nowYear && nowYear < birthYear + x.endAge) || null
  const dwRel = curDaewoon
    ? relationsOf(curDaewoon.ganziKorean?.[0] ?? curDaewoon.stem, curDaewoon.ganziKorean?.[1] ?? curDaewoon.branch, natal)
    : []

  // 세운 (올해~+2년)
  const years = [0, 1, 2].map((k) => {
    const y = nowYear + k
    const g = yearGanzi(y)
    const rels = relationsOf(g[0], g[1], natal)
    const stemGod = tenGod(dm, g[0])
    const branchGod = tenGod(dm, MAIN[g[1]])
    const stemGroup = grpOf(g[0]), branchGroup = grpOf(MAIN[g[1]])
    const good = rels.filter((r) => r.polarity === 'good').length
    const bad = rels.filter((r) => r.polarity === 'bad').length
    const spouseStar = (stemGroup === spouseGroup ? 1 : 0) + (branchGroup === spouseGroup ? 1 : 0)
    const expression = stemGroup === '식상' || branchGroup === '식상'
    const touchPalace = rels.filter((r) => /일지|일간/.test(r.with))
    const palaceGood = touchPalace.filter((r) => r.polarity === 'good').length
    const palaceBad = touchPalace.filter((r) => r.polarity === 'bad').length
    const tone = palaceBad && palaceGood ? 'mixed' : palaceBad ? 'caution' : palaceGood || spouseStar ? 'opportunity' : bad > good ? 'caution' : 'neutral'
    return {
      year: y, ganzi: g, ganziEn: ROMAN(g[0]) + '-' + ROMAN(g[1]), stemTenGod: stemGod, branchTenGod: branchGod, stemTenGodEn: TEN_GODS_ENGLISH[stemGod], branchTenGodEn: TEN_GODS_ENGLISH[branchGod],
      spouseStarShown: spouseStar, expressionShown: expression,
      relations: rels.map((r) => ({ type: r.type, with: r.with, label: r.label, en: r.en, polarity: r.polarity })),
      touchesSpousePalace: touchPalace.map((r) => r.label), touchesSpousePalaceEn: touchPalace.map((r) => r.en), tone,
    }
  })

  return {
    spouseStarGroup: spouseGroup,
    spouseStarElement: (ELEMENT_ENGLISH as any)[spouseEl] ?? spouseEl,
    spouseStarPositions: saju.marriageTiming?.spouseStarPositions ?? null,
    spouseStarCount: saju.marriageTiming?.spouseStarCount ?? null,
    palace: { branch: db, branchEn: ROMAN(db), tenGod: tenGod(dm, MAIN[db]), tenGodEn: TEN_GODS_ENGLISH[tenGod(dm, MAIN[db])], twelveStar: palaceStar, natalRelations: palaceNatalOut },
    dayMasterGrade: saju.expert?.grade ?? null,
    sinsal,
    currentDaewoon: curDaewoon ? { ganzi: curDaewoon.ganziKorean ?? curDaewoon.fullName, relations: dwRel.map((r) => r.en), touchesSpousePalace: dwRel.filter((r) => /일지|일간/.test(r.with)).map((r) => r.en), startAge: curDaewoon.startAge, endAge: curDaewoon.endAge } : null,
    yearLuck: years,
  }
}

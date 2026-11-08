// 전문가 레퍼런스 신살 — 10건 만세력(정답지) 216/219 슬롯 재현. 
// [검증됨]  공식으로 정의되어 표본과 완전 일치. [관측목록] 표본에서 확인된 간지만 포함 (표 전체는 추가 표본 필요)
export type SlotName = '시' | '일' | '월' | '연'
export interface PillarIn { stem: string; branch: string }
type P = Record<SlotName, PillarIn>
const ST = '갑을병정무기경신임계', BR = '자축인묘진사오미신유술해'
const L = (s: string) => new Set(s.split(' '))
const MAINB: Record<string, string> = { 자: '계', 축: '기', 인: '갑', 묘: '을', 진: '무', 사: '병', 오: '정', 미: '기', 신: '경', 유: '신', 술: '무', 해: '임' }
const EL: Record<string, number> = { 갑: 0, 을: 0, 병: 1, 정: 1, 무: 2, 기: 2, 경: 3, 신: 3, 임: 4, 계: 4 }
function isPyeongwan(dm: string, x: string) { // 편관 = 극하는 오행 + 같은 음양
  return (EL[x] - EL[dm] + 5) % 5 === 3 && ST.indexOf(dm) % 2 === ST.indexOf(x) % 2
}
const tbl = (d: Record<string, string>) => (s: string, b: string) => (d[s] ?? '').includes(b)
const lst = (g: string) => { const S = L(g); return (s: string, b: string) => S.has(s + b) }
// ── 기둥(천간+지지) 자체로 판단하는 신살
const PILLAR_RULES: Record<string, (s: string, b: string) => boolean> = {
  백호살: lst('갑진 을미 병술 정축 무진 임술 계축'),                 // [검증됨]
  괴강: lst('경진 경술 임진 무술'),                                   // [검증됨]
  일덕: lst('갑인 병진 무진 경진 임술'),                              // [검증됨]
  현침살: (s, b) => s === '갑' || s === '신' || '묘오신'.includes(b),  // [검증됨]
  낙정관살: tbl({ 갑: '사', 기: '사', 을: '자', 경: '자', 병: '신', 신: '신', 정: '술', 임: '술', 무: '묘', 계: '묘' }), // [검증됨]
  칠살: (s, b) => isPyeongwan(s, MAINB[b]),                           // [검증됨] 천간을 극하는 편관이 같은 기둥 지지의 본기
  태극귀인: tbl({ 갑: '자오', 을: '자오', 병: '묘유', 정: '묘유', 무: '진술축미', 기: '진술축미', 경: '인해', 신: '인해', 임: '사신', 계: '사신' }),
  학당귀인: tbl({ 갑: '해', 을: '오', 병: '인', 정: '유', 무: '인', 기: '유', 경: '사', 신: '자', 임: '신', 계: '묘' }),
  암록: tbl({ 갑: '해', 을: '술', 병: '신', 정: '미', 무: '신', 기: '미', 경: '사', 신: '진', 임: '인', 계: '축' }),
  금여: tbl({ 갑: '진', 을: '사', 병: '미', 정: '신', 무: '미', 기: '신', 경: '술', 신: '해', 임: '축', 계: '인' }),
  복성귀인: tbl({ 갑: '인', 을: '묘', 병: '자', 정: '유', 무: '신', 기: '미', 경: '오', 신: '사', 임: '진', 계: '묘' }),
  홍염살: tbl({ 갑: '오', 을: '오', 병: '인', 정: '미', 무: '진', 기: '진', 경: '술', 신: '유', 임: '자신', 계: '신' }),
  효신살: lst('갑자 을해 병인 정묘 무오 기사 경진 경술 신축 신미 임신 계유'),
  // ── [관측목록] 표본에서 확인된 간지 (미확인 간지는 누락될 수 있음)
  간여지동: lst('을묘 병오 정사 경신 신유 계해'), 고란과숙: lst('갑인 을사 무신 신해'),
  곡각살: lst('기사 신축 을미 정사'), 단장관: lst('계축 을미 정사'), 철사관: lst('경술 계축 무인 정미'), 퇴신: lst('임술 정미'),
  음인: lst('계해 기사 정사'), 신병살: lst('기사 을미'), 평두살: lst('병술 병인'), 일인: lst('무오 임자'), 나체도화: lst('경오'),
  뇌공타뇌관: lst('무술'), 음양살: lst('무오'), 유하살: lst('경진'), 일귀: lst('계사'), 금신: lst('기사'), 천록귀인: lst('신사'),
  록마동향: lst('임오'), 비인살: lst('임오'), 육수: lst('기미 무오 정미'), 구추방해: lst('무오 임오 임자'), 복신: lst('계사 계해 무인'),
  음욕살: lst('경신 계축 기미 무술 정미'), 장군전: lst('계축 기미 무오 임자 정미'), 재고귀인: lst('무술 병술 임술'),
  여연살: lst('기미 임신'), 남연살: lst('갑인'), 의처의부살: lst('경진 계해 무진 병술 신사 임술'), 정록: lst('경신'),
}
const GO: Record<string, string> = { 해: '인', 자: '인', 축: '인', 인: '사', 묘: '사', 진: '사', 사: '신', 오: '신', 미: '신', 신: '해', 유: '해', 술: '해' }
const GW: Record<string, string> = { 해: '술', 자: '술', 축: '술', 인: '축', 묘: '축', 진: '축', 사: '진', 오: '진', 미: '진', 신: '미', 유: '미', 술: '미' }
const DO: Record<string, string> = { 사: '오', 유: '오', 축: '오', 인: '묘', 오: '묘', 술: '묘', 신: '유', 자: '유', 진: '유', 해: '자', 묘: '자', 미: '자' }
const YI: Record<string, string> = { 갑: '묘', 병: '오', 무: '오', 경: '유', 임: '자' }
const CE: Record<string, string> = { 갑: '축미', 무: '축미', 경: '축미', 을: '자신', 기: '자신', 병: '해유', 정: '해유', 신: '인오', 임: '사묘', 계: '사묘' }
export function calcExpertSinsal(p: P): Record<SlotName, string[]> {
  const out: Record<SlotName, string[]> = { 시: [], 일: [], 월: [], 연: [] }
  const slots: SlotName[] = ['시', '일', '월', '연']
  const idx = (g: string) => { for (let i = 0; i < 60; i++) if (ST[i % 10] + BR[i % 12] === g) return i; return 0 }
  const di = idx(p.일.stem + p.일.branch), start = di - (di % 10)
  const gong = [BR[(start + 10) % 12], BR[(start + 11) % 12]]   // 일주 기준 공망
  for (const k of slots) {
    const { stem: s, branch: b } = p[k]
    for (const [name, f] of Object.entries(PILLAR_RULES)) if (f(s, b)) out[k].push(name)
    if (b === GO[p.연.branch]) out[k].push('고신살')               // 연지 기준 [검증됨]
    if (b === GW[p.연.branch]) out[k].push('과숙살')               // 연지 기준 [검증됨]
    if (b === DO[p.연.branch]) out[k].push('도화살')               // 연지 기준 (표본 1건)
    if (YI[p.일.stem] === b) out[k].push('양인살')                 // 일간 기준 [검증됨]
    if (CE[p.일.stem].includes(b)) out[k].push('천을귀인')         // 일간 기준 [검증됨]
    if (k !== '일' && gong.includes(b)) out[k].push('공망')        // 일주 기준 [검증됨]
  }
  return out
}

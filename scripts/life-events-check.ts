// 과거 타임라인 정답지: npx tsx scripts/life-events-check.ts
// 4명(본인 동의 받은 지인)의 실제 사건으로 레포트에 나갈 카드가 맞는지 확인한다. 하나라도 틀리면 exit 1.
import { buildLookBacks } from '../lib/saju/life-events'

const dw = (rows: [string, string, number, number][]) => rows.map(([stem, branch, startAge, endAge]) => ({ stem, branch, startAge, endAge }))
const P = (k: string) => ({ fullNameKorean: k })
const cases = [
  { name: 'Yuri 1996 F', gender: 'female' as const, birthYear: 1996,
    saju: { yearPillar: P('병자'), monthPillar: P('계사'), dayPillar: P('기미'), hourPillar: P('신미'),
      daewoon: dw([['임','진',6,16],['신','묘',16,26],['경','인',26,36],['기','축',36,46]]),
      expert: { eokYong: ['관성'], eokHee: ['식상','재성'], johu: { elements: ['수','금'] }, strong: true } },
    expect: { career: 2022, love: 2014 } },
  { name: 'Min Jung 1995 F', gender: 'female' as const, birthYear: 1995,
    saju: { yearPillar: P('갑술'), monthPillar: P('정축'), dayPillar: P('경술'), hourPillar: P('계미'),
      daewoon: dw([['병','자',4,14],['을','해',14,24],['갑','술',24,34],['계','유',34,44]]),
      expert: { eokYong: ['재성'], eokHee: ['식상'], johu: { elements: ['화','목'] }, strong: true } },
    expect: { career: 2018, love: null } },
  { name: 'Yu Jin 1993 F', gender: 'female' as const, birthYear: 1993,
    saju: { yearPillar: P('계유'), monthPillar: P('무오'), dayPillar: P('을축'), hourPillar: P('갑신'),
      daewoon: dw([['기','미',8,18],['경','신',18,28],['신','유',28,38],['임','술',38,48]]),
      expert: { eokYong: ['인성'], eokHee: [], johu: { elements: ['수','금'] }, strong: false } },
    expect: { career: 2020, love: 2020 } },
  { name: 'Yong Jin 1988 M', gender: 'male' as const, birthYear: 1988,
    saju: { yearPillar: P('무진'), monthPillar: P('계해'), dayPillar: P('기사'), hourPillar: P('임신'),
      daewoon: dw([['갑','자',9,19],['을','축',19,29],['병','인',29,39],['정','묘',39,49]]),
      expert: { eokYong: ['비겁'], eokHee: ['인성'], johu: { elements: ['화','목'] }, strong: false } },
    expect: { career: 2010, love: null } },
]

let fail = 0
for (const c of cases) {
  const lb = buildLookBacks(c.saju, c.gender, c.birthYear, 2026)
  const got = { career: lb?.career?.year ?? null, love: lb?.love?.year ?? null }
  const ok = got.career === c.expect.career && got.love === c.expect.love
  if (!ok) fail++
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${c.name}: career ${got.career} (want ${c.expect.career}) ${lb?.career?.kind ?? ''} | love ${got.love} (want ${c.expect.love})`)
}
process.exit(fail ? 1 : 0)

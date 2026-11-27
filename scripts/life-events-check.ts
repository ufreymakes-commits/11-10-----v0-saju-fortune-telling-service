// 정답지 대조용: npx tsx scripts/life-events-check.ts
import { scoreLifeEvents } from '../lib/saju/life-events'

const cases = [
  {
    name: 'Yuri (1996-05-22 15:24 Seoul, F)',
    input: {
      natal: { year: { stem: '병', branch: '자' }, month: { stem: '계', branch: '사' }, day: { stem: '기', branch: '미' }, hour: { stem: '신', branch: '미' } },
      daewoon: [['임', '진', 6, 16], ['신', '묘', 16, 26], ['경', '인', 26, 36], ['기', '축', 36, 46]].map(([stem, branch, startAge, endAge]) => ({ stem, branch, startAge, endAge })) as any,
      gender: 'female' as const, birthYear: 1996, favorable: ['관성', '식상', '재성'] as any, johuElements: ['수', '금'], strong: true,
      fromYear: 2011, toYear: 2026,
    },
    truth: { career: [2015, 2019, 2020, 2021, 2022], love: [2014, 2023, 2024], hard: [2018, 2020, 2026] },
  },
]

for (const c of cases) {
  const r = scoreLifeEvents(c.input)
  console.log(`\n=== ${c.name} ===`)
  for (const topic of ['career', 'love', 'hard'] as const) {
    const truth = new Set(c.truth[topic])
    const top = r[topic].slice(0, 8)
    const hits = top.filter((y) => truth.has(y.year)).length
    console.log(`\n[${topic}] top8 hits ${hits}/${truth.size}  (truth: ${[...truth].join(', ')})`)
    for (const y of top) console.log(`  ${truth.has(y.year) ? '✅' : '  '} ${y.year} (${y.age}) ${y.ganzi} score ${y.score}${y.kind ? ' [' + y.kind + ']' : ''} — ${y.reasons.join(' / ')}`)
  }
}

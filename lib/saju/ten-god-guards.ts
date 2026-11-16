// Shallow guardrails for ten gods / patterns. NOT full definitions: the model still reads the chart as a whole
// (position, strength, useful god, combinations). These lines only stop meanings from being flipped.
// Add a new line here whenever a wrong reading is found in a real report.

type Guard = { core: string; never: string }

export const TEN_GOD_GUARDS: Record<string, Guard> = {
  'Shoulder to Shoulder': { core: 'peers, self-reliance, equal partners, own pace', never: 'a source of money or authority by itself' },
  'Rob Wealth': { core: 'rivals, shared or contested resources, risk-taking, strong drive to compete', never: 'a star that attracts or accumulates wealth by itself' },
  'Eating God': { core: 'gentle expression, skill, enjoyment, nurturing, steady output', never: 'aggression or rebellion' },
  'Hurting Officer': { core: 'sharp expression, originality, challenging rules, talent that needs a stage', never: 'obedience, or a guarantee of success or of a partner' },
  'Indirect Wealth': { core: 'flexible, irregular money, opportunity, networking, large-scale dealing', never: 'a stable salary' },
  'Direct Wealth': { core: 'steady income, saving, practicality, reliability', never: 'risky or windfall money' },
  'Seven Killings': { core: 'pressure, drive, challenge, authority that tests you', never: 'a gentle or safe star' },
  'Direct Officer': { core: 'structure, reputation, responsibility, rules, orderly career', never: 'rebellion; also not a promise of a spouse or promotion' },
  'Indirect Seal': { core: 'unconventional learning, intuition, specialist or niche knowledge, solitude', never: 'ordinary study or a guarantee of support' },
  'Direct Seal': { core: 'learning, credentials, protection, support, a need for security and mastery', never: 'pioneering, rebellion or risk-taking' },
}

export const PATTERN_GUARDS: Record<string, Guard> = {
  'Rob Wealth Fighting Wealth': { core: 'many peers competing for little wealth: money tends to leak or be contested; protect savings, choose partners and shared finances carefully', never: 'a pattern that attracts resources or makes money easy' },
  'Seal-heavy, Wealth as medicine': { core: 'too much thinking/protection; practical action and earning loosen it', never: 'a pure wealth pattern' },
  'Excess Officers': { core: 'too much pressure or rules; expression, learning and boundaries relieve it', never: 'a sign of easy success' },
  'Wealth-heavy, Peers as medicine': { core: 'lots of money or tasks that the self cannot carry alone; allies and stamina help', never: 'automatic wealth' },
}

/** Text block for the prompt: only the ten gods / patterns that actually appear in this chart. */
export function buildGuardBlock(finalFacts: any): string {
  const txt = JSON.stringify(finalFacts ?? {})
  const lines: string[] = []
  for (const [name, g] of Object.entries(TEN_GOD_GUARDS)) {
    if (txt.includes(name + ' (') || txt.includes(name + ' pattern')) lines.push(`- ${name}: ${g.core}. Never describe it as ${g.never}.`)
  }
  for (const [name, g] of Object.entries(PATTERN_GUARDS)) {
    if (txt.includes(name)) lines.push(`- Pattern "${name}": ${g.core}. Never describe it as ${g.never}.`)
  }
  if (!lines.length) return ''
  return [
    'TEN GOD MEANING GUARDRAILS (anchors only; still read each star together with its position, the Day Master strength, the Useful God and the other stars in the chart; never flip these meanings):',
    ...lines,
  ].join('\n')
}

export type GuardHit = { why: string; fix: string; sentence: string; start: number; end: number }

type GuardRule = {
  re: RegExp
  why: string
  fix: string
  /** Length of the ten-god name at the start of the match; the contrast check only looks after it. */
  subjectLength?: number
}

// `(?<![a-z])` keeps "Indirect Wealth" / "Indirect Seal" from matching the "Direct ..." rules.
const GUARD_RULES: GuardRule[] = [
  {
    re: /rob wealth fighting wealth[^.]{0,120}(attract|draw|magnet|easily (make|earn)|excellent at|knack for)/gi,
    why: 'Rob Wealth Fighting Wealth described as attracting wealth',
    fix: 'Rob Wealth Fighting Wealth means many peers compete for little wealth: money tends to leak or be contested.',
  },
  {
    re: /(attract|draw|magnet)[^.]{0,60}rob wealth fighting wealth/gi,
    why: 'Rob Wealth Fighting Wealth described as attracting wealth',
    fix: 'Rob Wealth Fighting Wealth means many peers compete for little wealth: money tends to leak or be contested.',
  },
  {
    re: /(?<![a-z])direct seal[^.]{0,100}(pioneer|rebel|risk-taking|trailblaz)/gi,
    why: 'Direct Seal described as pioneering/rebellious',
    fix: 'Direct Seal means learning, credentials, protection and support; never pioneering, rebellion or risk-taking.',
    subjectLength: 11,
  },
  {
    re: /hurting officer[^.]{0,80}(obedien|rule-following|conformi)/gi,
    why: 'Hurting Officer described as obedient',
    fix: 'Hurting Officer means sharp expression, originality and challenging rules; never obedience.',
    subjectLength: 14,
  },
  {
    re: /(?<![a-z])direct wealth[^.]{0,80}(windfall|gambl|speculat)/gi,
    why: 'Direct Wealth described as windfall money',
    fix: 'Direct Wealth means steady earned income, saving and reliability; never windfall, gambling, speculative or lucky money. Windfall or irregular money belongs to Indirect Wealth only.',
    subjectLength: 13,
  },
]

// A statement that denies the flagged idea ("not a windfall", "avoids speculation") is what the guard wants, not a violation.
const NEGATION = /\b(not|never|no|without|rather than|instead of|unlike|avoids?|away from|far from|opposite of|steer(s)? clear of)\b|n't\b|\bn['’]t\b/i
// "Direct Wealth is steady, while Indirect Wealth brings windfalls": the flagged word belongs to another star.
const CONTRAST = /indirect wealth|indirect seal|rob wealth|eating god|hurting officer|seven killings|\b(while|whereas|but|versus|vs)\b|;/i

function sentenceBounds(text: string, start: number, end: number) {
  let s = start
  while (s > 0 && !/[.!?\n]/.test(text[s - 1])) s--
  let e = end
  while (e < text.length && !/[.!?\n]/.test(text[e])) e++
  if (e < text.length && text[e] !== '\n') e++
  return { start: s, end: e }
}

/** Violations of the known ten-god inversions, with the sentence that holds each one. Negated or contrasted mentions are skipped. */
export function findGuardHits(text: string): GuardHit[] {
  const hits: GuardHit[] = []
  for (const rule of GUARD_RULES) {
    for (const m of text.matchAll(rule.re)) {
      const span = m[0]
      const idx = m.index ?? 0
      const tail = rule.subjectLength ? span.slice(rule.subjectLength) : span
      if (NEGATION.test(span)) continue
      if (rule.subjectLength && CONTRAST.test(tail)) continue
      const b = sentenceBounds(text, idx, idx + span.length)
      if (hits.some((h) => h.start === b.start && h.why === rule.why)) continue
      hits.push({ why: rule.why, fix: rule.fix, sentence: text.slice(b.start, b.end), start: b.start, end: b.end })
    }
  }
  return hits
}

/** Cheap post-check for the known inversions. Returns human-readable reasons (empty = ok). */
export function checkGuards(text: string): string[] {
  return [...new Set(findGuardHits(text).map((h) => h.why))]
}

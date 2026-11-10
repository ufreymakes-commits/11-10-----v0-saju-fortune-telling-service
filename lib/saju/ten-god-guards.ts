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

/** Cheap post-check for the known inversions. Returns human-readable reasons (empty = ok). */
export function checkGuards(text: string): string[] {
  const t = text.toLowerCase()
  const out: string[] = []
  const rules: [RegExp, string][] = [
    [/rob wealth fighting wealth[^.]{0,120}(attract|draw|magnet|easily (make|earn)|excellent at|knack for)/, 'Rob Wealth Fighting Wealth described as attracting wealth'],
    [/(attract|draw|magnet)[^.]{0,60}rob wealth fighting wealth/, 'Rob Wealth Fighting Wealth described as attracting wealth'],
    [/direct seal[^.]{0,100}(pioneer|rebel|risk-taking|trailblaz)/, 'Direct Seal described as pioneering/rebellious'],
    [/hurting officer[^.]{0,80}(obedien|rule-following|conformi)/, 'Hurting Officer described as obedient'],
    [/direct wealth[^.]{0,80}(windfall|gambl|speculat)/, 'Direct Wealth described as windfall money'],
  ]
  for (const [re, why] of rules) if (re.test(t) && !out.includes(why)) out.push(why)
  return out
}

const IDX: Record<string, number> = { 연: 0, 월: 1, 일: 2, 시: 3 }
function pillarsIn(s: string): number[] {
  return [...new Set([...s.matchAll(/(연|월|일|시)(간|지)/g)].map((x) => IDX[x[1]]))].sort((a, b) => a - b)
}
function free(s: string) { return /\(해\)|원진/.test(s) || /\(삼합\)|\(방합\)/.test(s) || /→[^()]+합$/.test(s) /* 천간합: 거리 무관 */ }
export function adjacentOnly(list: string[] | undefined): string[] {
  return (list ?? []).filter((s) => { const p = pillarsIn(s); return free(s) || p.length < 2 || p.every((v, i) => i === 0 || v - p[i - 1] === 1) })
}

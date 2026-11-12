// From November on, plans and timing focus on the next calendar year.
export function focusYearFor(now = new Date()): number {
  const y = now.getMonth() >= 10 ? now.getFullYear() + 1 : now.getFullYear()
  return Math.max(y, 2026)
}

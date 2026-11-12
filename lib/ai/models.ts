export const PAID_MODEL = 'google/gemini-3.8-flash' // paid 99-facts report, its repairs, Gumiho
export const FREE_MODEL = 'google/gemini-3.5-flash-lite' // free 3-facts report (cheap)

export type Thinking = Record<string, unknown>

/** AI SDK providerOptions for a Google thinking config. */
export function googleThinking(thinkingConfig: Thinking): any {
  return { google: { thinkingConfig } }
}

function isAbortOrRateLimit(error: any): boolean {
  const name = String(error?.name ?? '')
  const message = String(error?.message ?? '').toLowerCase()
  const status = error?.statusCode ?? error?.status ?? error?.cause?.statusCode
  if (name === 'AbortError' || name === 'TimeoutError') return true
  if (status === 429 || status === 408 || status === 504) return true
  return (
    message.includes('abort') ||
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('quota')
  )
}

// Only parameter/config rejections should move on to the next thinking config.
function isThinkingConfigError(error: any): boolean {
  const message = String(error?.message ?? '').toLowerCase()
  const body = String(error?.responseBody ?? '').toLowerCase()
  const text = `${message} ${body}`
  const status = error?.statusCode ?? error?.status
  if (status === 400 || status === 422) return true
  return (
    text.includes('thinking') ||
    text.includes('invalid argument') ||
    text.includes('invalid_argument') ||
    text.includes('unsupported') ||
    text.includes('not supported') ||
    text.includes('unknown field') ||
    text.includes('invalid parameter') ||
    text.includes('invalid value')
  )
}

/**
 * Tries each thinking config in order. Moves on only for config/parameter errors,
 * never for timeout / abort / rate limit errors (those are rethrown immediately).
 */
export async function withThinkingFallback<T>(
  configs: Thinking[],
  run: (thinkingConfig: Thinking) => Promise<T>,
  modelId: string = 'unknown',
): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i]
    try {
      const result = await run(config)
      console.log(`[v0] model ${modelId} thinking ${JSON.stringify(config)}`)
      return result
    } catch (error) {
      lastError = error
      if (isAbortOrRateLimit(error)) throw error
      const hasNext = i < configs.length - 1
      if (!hasNext || !isThinkingConfigError(error)) throw error
      console.warn(
        `[v0] model ${modelId} thinking ${JSON.stringify(config)} rejected, trying next:`,
        (error as any)?.message?.slice?.(0, 200),
      )
    }
  }
  throw lastError
}

export const THINK = {
  paidMedium: [{ thinkingLevel: 'medium' }, { thinkingBudget: 2048 }] as Thinking[],
  paidLow: [{ thinkingLevel: 'low' }, { thinkingBudget: 0 }] as Thinking[],
  freeLight: [
    { thinkingLevel: 'minimal' },
    { thinkingLevel: 'low' },
    { thinkingBudget: 0 },
  ] as Thinking[],
}

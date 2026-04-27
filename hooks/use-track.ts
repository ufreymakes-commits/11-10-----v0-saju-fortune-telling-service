// Simple analytics tracking hook
// Sends events to /api/track (stored in Supabase analytics_events table)

let sessionId: string | null = null

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  if (!sessionId) {
    sessionId = sessionStorage.getItem('_sid') || Math.random().toString(36).slice(2)
    sessionStorage.setItem('_sid', sessionId)
  }
  return sessionId
}

export async function track(
  event_type: string,
  page?: string,
  metadata?: Record<string, unknown>
) {
  if (typeof window === 'undefined') return
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type,
        page: page || window.location.pathname,
        metadata: metadata || {},
        session_id: getSessionId(),
      }),
    })
  } catch {
    // silently fail - tracking should never break the app
  }
}

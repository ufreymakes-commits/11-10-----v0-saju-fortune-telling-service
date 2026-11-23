import { updateSession } from '@/lib/supabase/middleware'
import { cleanUtmValue, UTM_KEYS } from '@/lib/utm-attribution'
import { type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const response = await updateSession(request)

  for (const key of UTM_KEYS) {
    const value = cleanUtmValue(request.nextUrl.searchParams.get(key))
    if (!value) continue

    request.cookies.set(key, value)
    response.cookies.set(key, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 90,
    })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

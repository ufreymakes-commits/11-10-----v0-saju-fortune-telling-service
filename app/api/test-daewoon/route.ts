import { calculateSaju } from '@/lib/saju-calculator'
import { NextResponse } from 'next/server'

/**
 * 대운 계산 검증용 API
 * GET /api/test-daewoon?birthDate=2002-03-03&hour=15&minute=30&gender=female&country=South%20Korea
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  const birthDate = searchParams.get('birthDate') || '2002-03-03'
  const hour = searchParams.get('hour') || '15'
  const minute = searchParams.get('minute') || '30'
  const gender = searchParams.get('gender') || 'female'
  const country = searchParams.get('country') || 'South Korea'

  try {
    const result = calculateSaju({
      birthDate,
      birthTime: `${hour}:${minute}`,
      gender: gender as 'male' | 'female',
      birthCountry: country
    })

    return NextResponse.json({
      input: { birthDate, hour, minute, gender, country },
      daewoon: result.daewoon?.slice(0, 10).map(d => ({
        startAge: d.startAge,
        endAge: d.endAge,
        ganzi: `${d.stem}${d.branch}`,
        fullName: d.fullName
      }))
    })
  } catch (error) {
    console.error('[v0] Daewoon test error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

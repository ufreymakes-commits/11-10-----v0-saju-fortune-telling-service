import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { calculateSaju } from '@/lib/saju-calculator'
import type { BirthInfo } from '@/lib/types'
import { RELATIONSHIP_TYPES } from '@/lib/compat/constants'
import { cleanConcern } from '@/lib/compat/prompt-facts'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      // Person A
      personAName, personABirthDate, personABirthTime, personABirthCountry,
      personABirthCity, personATimezone, personALongitude, personALatitude, personAGender,
      // Person B
      personBName, personBBirthDate, personBBirthTime, personBBirthCountry,
      personBBirthCity, personBTimezone, personBLongitude, personBLatitude, personBGender,
      // Meta
      referralSource,
      relationshipType, concern,
    } = body

    // Old cached pages may not send relationshipType; only reject values that are present but invalid
    if (relationshipType && !(RELATIONSHIP_TYPES as readonly string[]).includes(relationshipType)) {
      return NextResponse.json({ error: 'Invalid relationship type' }, { status: 400 })
    }
    const cleanedConcern = cleanConcern(concern)

    // Validate required fields
    if (!personAName || !personABirthDate || !personABirthCountry || !personAGender ||
        !personBName || !personBBirthDate || !personBBirthCountry || !personBGender) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate saju data for Person A
    const birthInfoA: BirthInfo = {
      name: personAName,
      birthDate: personABirthDate,
      birthCountry: personABirthCountry,
      birthTime: personABirthTime || undefined,
      gender: personAGender,
      referralSource: referralSource || 'direct',
      birthCity: personABirthCity || undefined,
      timezone: personATimezone || undefined,
      longitude: personALongitude || undefined,
      latitude: personALatitude || undefined,
    }

    // Calculate saju data for Person B
    const birthInfoB: BirthInfo = {
      name: personBName,
      birthDate: personBBirthDate,
      birthCountry: personBBirthCountry,
      birthTime: personBBirthTime || undefined,
      gender: personBGender,
      referralSource: referralSource || 'direct',
      birthCity: personBBirthCity || undefined,
      timezone: personBTimezone || undefined,
      longitude: personBLongitude || undefined,
      latitude: personBLatitude || undefined,
    }

    const sajuDataA = calculateSaju(birthInfoA)
    const sajuDataB = calculateSaju(birthInfoB)

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('compatibility_submissions')
      .insert({
        person_a_name: personAName,
        person_a_birth_date: personABirthDate,
        person_a_birth_time: personABirthTime || null,
        person_a_birth_country: personABirthCountry,
        person_a_birth_city: personABirthCity || null,
        person_a_timezone: personATimezone || null,
        person_a_longitude: personALongitude || null,
        person_a_latitude: personALatitude || null,
        person_a_gender: personAGender,
        person_a_saju_data: sajuDataA,
        person_b_name: personBName,
        person_b_birth_date: personBBirthDate,
        person_b_birth_time: personBBirthTime || null,
        person_b_birth_country: personBBirthCountry,
        person_b_birth_city: personBBirthCity || null,
        person_b_timezone: personBTimezone || null,
        person_b_longitude: personBLongitude || null,
        person_b_latitude: personBLatitude || null,
        person_b_gender: personBGender,
        person_b_saju_data: sajuDataB,
        referral_source: referralSource || null,
        relationship_type: relationshipType || null,
        concern: cleanedConcern || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[v0] Compatibility submit error:', error)
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
    }

    return NextResponse.json({ submissionId: data.id })
  } catch (error) {
    console.error('[v0] Compatibility submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

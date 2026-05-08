import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateSaju } from '@/lib/saju-calculator'
import { runSajuTests } from '@/lib/saju-test'
import type { BirthInfo } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { 
      name, birthDate, birthCountry, birthTime, gender, referralSource,
      // New fields for precise timezone/location
      birthCity, timezone, longitude, latitude 
    } = body
    
    // Validate required fields
    if (!name || !birthDate || !birthCountry || !gender || !referralSource) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Calculate Saju data with enhanced timezone/location info
    const birthInfo: BirthInfo = {
      name,
      birthDate,
      birthCountry,
      birthTime: birthTime || undefined,
      gender,
      referralSource,
      // New optional fields for true solar time calculation
      birthCity: birthCity || undefined,
      timezone: timezone || undefined,
      longitude: longitude || undefined,
      latitude: latitude || undefined
    }
    
    const sajuData = calculateSaju(birthInfo)
    
    // Debug: Log calculated saju pillars for verification
    console.log('[v0] Saju calculation result:', {
      input: { birthDate, birthTime, birthCountry, birthCity, timezone, longitude },
      pillars: {
        year: sajuData.fourPillars?.year,
        month: sajuData.fourPillars?.month,
        day: sajuData.fourPillars?.day,
        hour: sajuData.fourPillars?.hour
      }
    })
    
    // Run test suite once per deployment (only logs to console, no side effects)
    runSajuTests()
    
    // Store in database
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        name,
        birth_date: birthDate,
        birth_country: birthCountry,
        birth_time: birthTime || null,
        gender,
        referral_source: referralSource,
        saju_data: sajuData,
        // New fields for precise timezone/location
        birth_city: birthCity || null,
        timezone: timezone || null,
        longitude: longitude || null,
        latitude: latitude || null
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('[v0] Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ submissionId: data.id })
  } catch (error) {
    console.error('[v0] Submit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

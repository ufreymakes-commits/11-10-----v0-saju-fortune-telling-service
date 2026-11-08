import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateSaju } from '@/lib/saju-calculator'
import { runSajuTests } from '@/lib/saju-test'
import type { BirthInfo } from '@/lib/types'
import { isValidEmail } from '@/lib/validation'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { 
      name, email, birthDate, birthCountry, birthTime, gender, referralSource,
      birthCity, timezone, longitude, latitude, yajasi 
    } = body
    
    // Validate required fields
    if (!name || !email || !birthDate || !birthCountry || !gender || !referralSource) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Calculate Saju data
    const birthInfo: BirthInfo = {
      name,
      email,
      birthDate,
      birthCountry,
      birthTime: birthTime || undefined,
      gender,
      referralSource,
      birthCity: birthCity || undefined,
      timezone: timezone || undefined,
      longitude: longitude || undefined,
      latitude: latitude || undefined,
      // 야자시: 'none'(미적용)만 명시적으로 선택된 경우, 그 외는 기본 'apply'
      yajasi: yajasi === 'none' ? 'none' : 'apply'
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
    
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        name,
        email,
        birth_date: birthDate,
        birth_country: birthCountry,
        birth_time: birthTime || null,
        gender,
        referral_source: referralSource,
        saju_data: sajuData,
        birth_city: birthCity || null,
        timezone: timezone || null,
        longitude: longitude || null,
        latitude: latitude || null
        // client_ip: clientIP  // TODO: Add after adding column to DB
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
    
    return NextResponse.json({ 
      submissionId: data.id,
      _debug: {
        raw_birthCountry: birthCountry,
        raw_timezone: timezone,
        raw_longitude: longitude,
        raw_birthCity: birthCity,
        birthDate,
        birthTime,
        fourPillars: {
          year: sajuData.fourPillars?.year,
          month: sajuData.fourPillars?.month,
          day: sajuData.fourPillars?.day,
          hour: sajuData.fourPillars?.hour
        }
      }
    })
  } catch (error) {
    console.error('[v0] Submit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

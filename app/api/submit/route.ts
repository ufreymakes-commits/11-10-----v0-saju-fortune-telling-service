import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateSaju } from '@/lib/saju-calculator'
import { runSajuTests } from '@/lib/saju-test'
import type { BirthInfo } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { name, birthDate, birthCountry, birthTime, gender, referralSource } = body
    
    // Validate required fields
    if (!name || !birthDate || !birthCountry || !gender || !referralSource) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Calculate Saju data
    const birthInfo: BirthInfo = {
      name,
      birthDate,
      birthCountry,
      birthTime: birthTime || undefined,
      gender,
      referralSource
    }
    
    const sajuData = calculateSaju(birthInfo)
    
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
        saju_data: sajuData
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

import { NextResponse, headers } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateSaju } from '@/lib/saju-calculator'
import { runSajuTests } from '@/lib/saju-test'
import type { BirthInfo } from '@/lib/types'

// Helper function to get client IP address
function getClientIP(request: Request): string {
  const headersList = headers()
  
  // Try to get IP from common proxy headers
  const forwarded = headersList.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, use the first one
    return forwarded.split(',')[0].trim()
  }
  
  // Cloudflare
  const cfIP = headersList.get('cf-connecting-ip')
  if (cfIP) return cfIP
  
  // Fallback (rarely used)
  return headersList.get('x-real-ip') || 'unknown'
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { 
      name, birthDate, birthCountry, birthTime, gender, referralSource,
      birthCity, timezone, longitude, latitude 
    } = body
    
    // Validate required fields
    if (!name || !birthDate || !birthCountry || !gender || !referralSource) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Get client IP address
    const clientIP = getClientIP(request)
    console.log('[v0] Submission from IP:', clientIP)
    
    // Check daily submission limit (3 per day per IP address)
    // TODO: Uncomment after adding client_ip column to submissions table
    /*
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    
    const { count: submissionCount, error: countError } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('client_ip', clientIP)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
    
    if (countError) {
      console.error('[v0] Error checking submission limit:', countError)
      return NextResponse.json(
        { error: 'Failed to check submission limit' },
        { status: 500 }
      )
    }
    
    if ((submissionCount || 0) >= 3) {
      return NextResponse.json(
        { 
          error: 'Daily submission limit reached. Please try again tomorrow!',
          limitReached: true 
        },
        { status: 429 }
      )
    }
    */
    
    // Calculate Saju data
    const birthInfo: BirthInfo = {
      name,
      birthDate,
      birthCountry,
      birthTime: birthTime || undefined,
      gender,
      referralSource,
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

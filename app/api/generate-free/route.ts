import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SajuData, Fact } from '@/lib/types'

// PLACEHOLDER: Replace with actual AI-powered generation using your prompts
// This function generates 9 free facts + 3 teaser facts based on Saju data
function generateFreeFacts(sajuData: SajuData, name: string): { freeFacts: Fact[], teaserFacts: Fact[] } {
  const { dayMaster, dominantElement, personalityType, luckyElement, elementBalance } = sajuData
  
  // Free facts (9 facts)
  const freeFacts: Fact[] = [
    {
      id: 1,
      text: `${name}, your Day Master is ${dayMaster}, which means you possess a unique inner strength that others often admire from afar.`,
      category: 'personality'
    },
    {
      id: 2,
      text: `As "${personalityType}", you have an innate ability to see possibilities where others see obstacles.`,
      category: 'personality'
    },
    {
      id: 3,
      text: `Your dominant element is ${dominantElement}. This shapes how you interact with the world and process emotions.`,
      category: 'personality'
    },
    {
      id: 4,
      text: `People with your chart often find success in careers that allow for ${dominantElement === 'Fire' ? 'leadership and inspiration' : dominantElement === 'Water' ? 'creativity and intuition' : dominantElement === 'Wood' ? 'growth and innovation' : dominantElement === 'Metal' ? 'precision and organization' : 'nurturing and stability'}.`,
      category: 'career'
    },
    {
      id: 5,
      text: `Your ${luckyElement} element is what brings you fortune. Surrounding yourself with ${luckyElement.toLowerCase()}-associated colors and environments can enhance your luck.`,
      category: 'career'
    },
    {
      id: 6,
      text: `In relationships, you tend to be ${dominantElement === 'Fire' ? 'passionate and protective' : dominantElement === 'Water' ? 'deeply emotional and intuitive' : dominantElement === 'Wood' ? 'nurturing and growth-oriented' : dominantElement === 'Metal' ? 'loyal and principled' : 'stable and dependable'}.`,
      category: 'love'
    },
    {
      id: 7,
      text: `Your element balance shows ${Object.entries(elementBalance).sort((a, b) => b[1] - a[1])[0][0]} is strongest. This influences your life path significantly.`,
      category: 'future'
    },
    {
      id: 8,
      text: `The cosmos suggests that your greatest personal growth will come through embracing your ${luckyElement.toLowerCase()} nature.`,
      category: 'future'
    },
    {
      id: 9,
      text: `${name}, your birth chart reveals a soul that has been on a long journey. This lifetime holds special significance for you.`,
      category: 'personality'
    }
  ]
  
  // Teaser facts (masked - shown but blurred to entice purchase)
  const teaserFacts: Fact[] = [
    {
      id: 10,
      text: `Your ideal romantic partner has a specific element that complements your ${dominantElement} nature perfectly...`,
      category: 'love',
      isMasked: true
    },
    {
      id: 11,
      text: `There is a specific year in your near future that will be transformative for your career...`,
      category: 'career',
      isMasked: true
    },
    {
      id: 12,
      text: `Your hidden talent that most people never discover about themselves is connected to your ${dayMaster} energy...`,
      category: 'personality',
      isMasked: true
    }
  ]
  
  return { freeFacts, teaserFacts }
}

export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json()
    
    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submission ID' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Get submission data
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single()
    
    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }
    
    // Check if we already generated free facts
    const { data: existingReport } = await supabase
      .from('reports')
      .select('*')
      .eq('submission_id', submissionId)
      .eq('section_key', 'free_preview')
      .single()
    
    if (existingReport) {
      return NextResponse.json({
        freeFacts: existingReport.facts.filter((f: Fact) => !f.isMasked),
        teaserFacts: existingReport.facts.filter((f: Fact) => f.isMasked),
        submission: {
          name: submission.name,
          sajuData: submission.saju_data
        }
      })
    }
    
    // Generate facts
    const { freeFacts, teaserFacts } = generateFreeFacts(
      submission.saju_data as SajuData, 
      submission.name
    )
    
    // Store the facts
    const { error: insertError } = await supabase
      .from('reports')
      .insert({
        submission_id: submissionId,
        section_key: 'free_preview',
        facts: [...freeFacts, ...teaserFacts],
        is_free: true
      })
    
    if (insertError) {
      console.error('[v0] Error storing free facts:', insertError)
    }
    
    return NextResponse.json({
      freeFacts,
      teaserFacts,
      submission: {
        name: submission.name,
        sajuData: submission.saju_data
      }
    })
  } catch (error) {
    console.error('[v0] Generate free facts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SajuData, Fact, Submission } from '@/lib/types'

// PLACEHOLDER: Replace with your actual AI prompts and OpenAI integration
// Each section generates approximately 25 facts
// The function receives previous context to ensure coherence

interface GenerateSectionParams {
  sectionKey: string
  submission: Submission
  previousFacts: Fact[]
}

function generateSectionFacts({ sectionKey, submission, previousFacts }: GenerateSectionParams): Fact[] {
  const sajuData = submission.saju_data as SajuData
  const name = submission.name
  const { dayMaster, dominantElement, personalityType, luckyElement, elementBalance } = sajuData
  
  // Base ID for this section
  const baseId = previousFacts.length + 1
  
  // PLACEHOLDER: This is where you would call OpenAI with your custom prompts
  // For now, generating placeholder facts based on section
  
  const sectionGenerators: Record<string, () => Fact[]> = {
    personality: () => generatePersonalityFacts(baseId, name, sajuData),
    career: () => generateCareerFacts(baseId, name, sajuData, previousFacts),
    love: () => generateLoveFacts(baseId, name, sajuData, previousFacts),
    future: () => generateFutureFacts(baseId, name, sajuData, previousFacts)
  }
  
  const generator = sectionGenerators[sectionKey]
  return generator ? generator() : []
}

function generatePersonalityFacts(baseId: number, name: string, saju: SajuData): Fact[] {
  const facts: Fact[] = []
  const { dayMaster, dominantElement, personalityType, luckyElement, elementBalance } = saju
  
  // Generate 25 personality facts
  const personalityTemplates = [
    `${name}, your ${dayMaster} Day Master reveals a soul that naturally gravitates toward authenticity in all things.`,
    `As "${personalityType}", you possess an innate wisdom that often surprises even yourself.`,
    `Your ${dominantElement} nature gives you a unique perspective on life that others find refreshing.`,
    `People are drawn to your energy because it carries the essence of ${dominantElement.toLowerCase()} - ${getElementQuality(dominantElement)}.`,
    `Your birth chart shows a deep connection to intuition that strengthens with age.`,
    `The balance of elements in your chart (${formatElementBalance(elementBalance)}) reveals a complex inner world.`,
    `You have a natural gift for ${getElementGift(dominantElement)} that you may not have fully explored.`,
    `Your emotional depth is one of your greatest strengths, allowing you to understand others profoundly.`,
    `The ${luckyElement} energy in your chart suggests you thrive in environments that nurture this element.`,
    `Your ${dayMaster} energy manifests as a quiet determination that others admire.`,
    `You process the world through a lens of ${dominantElement.toLowerCase()}, making you naturally ${getElementProcessing(dominantElement)}.`,
    `There is a creative spark within you connected to your ${saju.yearPillar.branch} year pillar.`,
    `Your inner child remains vibrant, connected to the ${saju.monthPillar.stem} energy of your birth month.`,
    `You have untapped potential in areas related to ${luckyElement.toLowerCase()} activities.`,
    `Your chart reveals a strong sense of justice and fairness in your core values.`,
    `The combination of ${saju.dayPillar.stem} and ${saju.dayPillar.branch} gives you remarkable resilience.`,
    `You often think in ways that others find unconventional yet brilliant.`,
    `Your ${dominantElement} dominant nature means you excel when given freedom to express yourself.`,
    `There is a philosophical side to you that contemplates life's deeper meanings.`,
    `Your chart shows you are destined to inspire others, whether you realize it or not.`,
    `The ${saju.yearPillar.stem} influence gives you a connection to tradition and heritage.`,
    `You have a natural ability to sense when something is not quite right.`,
    `Your birth timing aligned with energies that favor personal growth and transformation.`,
    `The ${saju.monthPillar.branch} energy suggests you have hidden talents waiting to emerge.`,
    `${name}, your chart confirms you are on a unique path that only you can walk.`
  ]
  
  personalityTemplates.forEach((text, index) => {
    facts.push({
      id: baseId + index,
      text,
      category: 'personality'
    })
  })
  
  return facts
}

function generateCareerFacts(baseId: number, name: string, saju: SajuData, previousFacts: Fact[]): Fact[] {
  const facts: Fact[] = []
  const { dayMaster, dominantElement, luckyElement } = saju
  
  const careerTemplates = [
    `${name}, your career path is illuminated by the ${luckyElement} element, drawing you toward ${getCareerField(luckyElement)}.`,
    `Your ${dayMaster} Day Master suggests leadership potential that emerges naturally over time.`,
    `Financial prosperity is connected to activities that align with your ${dominantElement} nature.`,
    `Your chart favors careers that allow for ${dominantElement === 'Fire' ? 'inspiration and visibility' : dominantElement === 'Water' ? 'creativity and flow' : dominantElement === 'Wood' ? 'growth and innovation' : dominantElement === 'Metal' ? 'precision and structure' : 'nurturing and service'}.`,
    `The best time for major career decisions aligns with your ${luckyElement.toLowerCase()} cycles.`,
    `Collaboration with people who have ${getComplementaryElement(dominantElement)} energy brings success.`,
    `Your wealth potential increases when you follow your intuition rather than conventional paths.`,
    `Side projects or passion pursuits may become significant income sources for you.`,
    `Your chart shows potential for multiple income streams later in life.`,
    `Recognition for your work comes through persistence aligned with your ${dayMaster} energy.`,
    `The ${saju.yearPillar.branch} influence suggests inherited talents that can be monetized.`,
    `Your professional reputation will be built on ${getElementReputation(dominantElement)}.`,
    `Networking in ${luckyElement.toLowerCase()}-related industries opens unexpected doors.`,
    `Your chart suggests success in roles that require ${getElementSkill(dominantElement)}.`,
    `Financial security comes through building on your natural ${dominantElement.toLowerCase()} strengths.`,
    `Your ${saju.monthPillar.stem} energy indicates a career peak in your middle years.`,
    `Entrepreneurial ventures are favored when they align with your ${luckyElement} element.`,
    `Your ability to ${getElementAbility(dayMaster)} makes you valuable in any organization.`,
    `The combination of your elements suggests you work best with some autonomy.`,
    `Investments related to ${luckyElement.toLowerCase()} tend to favor your chart.`,
    `Your chart shows you are destined to make an impact in your chosen field.`,
    `Career transitions are smoother when made during ${luckyElement}-dominant periods.`,
    `Your natural talents position you for roles in ${getCareerRole(dominantElement)}.`,
    `Financial wisdom comes to you through experience rather than formal education.`,
    `${name}, your chart confirms you have the elements for lasting professional success.`
  ]
  
  careerTemplates.forEach((text, index) => {
    facts.push({
      id: baseId + index,
      text,
      category: 'career'
    })
  })
  
  return facts
}

function generateLoveFacts(baseId: number, name: string, saju: SajuData, previousFacts: Fact[]): Fact[] {
  const facts: Fact[] = []
  const { dayMaster, dominantElement, luckyElement, personalityType } = saju
  
  const loveTemplates = [
    `${name}, your ideal partner carries ${getComplementaryElement(dominantElement)} energy that balances your ${dominantElement}.`,
    `In love, your "${personalityType}" nature seeks depth over superficiality.`,
    `Your ${dayMaster} Day Master makes you ${getDayMasterLoveStyle(dayMaster)} in relationships.`,
    `Romantic fulfillment comes when you embrace your authentic ${dominantElement.toLowerCase()} nature.`,
    `Your chart suggests you are attracted to partners who challenge your growth.`,
    `The ${luckyElement} element plays a key role in your most harmonious relationships.`,
    `Your love language is deeply connected to ${getElementLoveLanguage(dominantElement)}.`,
    `Past relationship patterns often repeat until you understand your ${dayMaster} needs.`,
    `Compatibility is strongest with those whose charts complement your ${saju.dayPillar.branch}.`,
    `Your emotional needs in partnership relate to ${getElementEmotionalNeed(dominantElement)}.`,
    `The ${saju.monthPillar.stem} influence affects how you express affection.`,
    `Your chart favors relationships that begin during ${luckyElement}-aligned periods.`,
    `Trust is built slowly for you, reflecting your ${dominantElement} nature.`,
    `Your ideal relationship provides both ${getElementRelationshipNeed(dominantElement)} and freedom.`,
    `Romance flourishes when your partner respects your ${dayMaster} energy.`,
    `Your chart shows potential for a deeply transformative love connection.`,
    `Communication in relationships improves when you honor your ${dominantElement} style.`,
    `The ${saju.yearPillar.stem} influence shapes your long-term relationship goals.`,
    `Your birth chart suggests a destined connection with someone of ${getCompatibleElement(dominantElement)} nature.`,
    `Intimacy deepens when you feel your ${dominantElement.toLowerCase()} needs are understood.`,
    `Your ${personalityType} nature means you need a partner who appreciates depth.`,
    `Relationship challenges often relate to balancing ${dominantElement} with other elements.`,
    `Your chart shows love becomes more fulfilling as you mature.`,
    `The ${saju.dayPillar.stem} and ${saju.dayPillar.branch} combination defines your romantic destiny.`,
    `${name}, your chart confirms true love is written in your stars.`
  ]
  
  loveTemplates.forEach((text, index) => {
    facts.push({
      id: baseId + index,
      text,
      category: 'love'
    })
  })
  
  return facts
}

function generateFutureFacts(baseId: number, name: string, saju: SajuData, previousFacts: Fact[]): Fact[] {
  const facts: Fact[] = []
  const { dayMaster, dominantElement, luckyElement, personalityType } = saju
  const currentYear = new Date().getFullYear()
  
  const futureTemplates = [
    `${name}, the coming years favor those with ${dominantElement} energy like yourself.`,
    `${currentYear + 1} brings opportunities aligned with your ${luckyElement} element.`,
    `Your ${dayMaster} Day Master enters a favorable cycle for personal growth.`,
    `Major life decisions made in ${luckyElement}-dominant years tend to prosper.`,
    `Your chart shows a significant milestone around age ${30 + Math.floor(Math.random() * 10)}.`,
    `The ${saju.yearPillar.branch} energy suggests travel opportunities ahead.`,
    `Your ${dominantElement} nature will be especially powerful in the next few years.`,
    `Financial growth accelerates when you align with ${luckyElement.toLowerCase()} activities.`,
    `A meaningful connection enters your life during a ${getComplementaryElement(dominantElement)}-dominant period.`,
    `Your chart shows health remains strong when you honor your elemental balance.`,
    `The ${saju.monthPillar.stem} influence brings creative breakthroughs.`,
    `Your "${personalityType}" path leads to recognition in your community.`,
    `${currentYear + 2} offers chances for significant personal transformation.`,
    `Your ${luckyElement} cycles suggest favorable periods for major purchases.`,
    `The combination of upcoming energies supports your ${dominantElement} goals.`,
    `Your chart indicates a period of learning and expansion ahead.`,
    `Relationships deepen as you enter more ${getComplementaryElement(dominantElement)}-balanced cycles.`,
    `Your professional path takes an upward turn within the next three years.`,
    `The ${saju.dayPillar.branch} energy supports your long-term aspirations.`,
    `${name}, your chart shows you are entering a powerful phase of manifestation.`,
    `Opportunities for leadership emerge as you embrace your ${dayMaster} energy.`,
    `Your elemental balance shifts favorably for personal goals.`,
    `The years ahead hold promise for those who embody ${dominantElement} wisdom.`,
    `Your chart confirms the best is yet to come on your unique journey.`
  ]
  
  futureTemplates.forEach((text, index) => {
    facts.push({
      id: baseId + index,
      text,
      category: 'future'
    })
  })
  
  return facts
}

// Helper functions
function getElementQuality(element: string): string {
  const qualities: Record<string, string> = {
    Wood: 'growth, flexibility, and compassion',
    Fire: 'warmth, passion, and inspiration',
    Earth: 'stability, nurturing, and reliability',
    Metal: 'precision, strength, and clarity',
    Water: 'wisdom, depth, and adaptability'
  }
  return qualities[element] || 'unique energy'
}

function getElementGift(element: string): string {
  const gifts: Record<string, string> = {
    Wood: 'nurturing growth in others',
    Fire: 'inspiring and motivating people',
    Earth: 'creating stability and comfort',
    Metal: 'organizing and refining ideas',
    Water: 'understanding deep emotions'
  }
  return gifts[element] || 'connecting with others'
}

function getElementProcessing(element: string): string {
  const processing: Record<string, string> = {
    Wood: 'forward-thinking and optimistic',
    Fire: 'intuitive and action-oriented',
    Earth: 'practical and grounded',
    Metal: 'analytical and precise',
    Water: 'reflective and perceptive'
  }
  return processing[element] || 'thoughtful'
}

function formatElementBalance(balance: Record<string, number>): string {
  return Object.entries(balance)
    .sort((a, b) => b[1] - a[1])
    .map(([el, val]) => `${el}: ${val}`)
    .join(', ')
}

function getComplementaryElement(element: string): string {
  const complements: Record<string, string> = {
    Wood: 'Water',
    Fire: 'Wood',
    Earth: 'Fire',
    Metal: 'Earth',
    Water: 'Metal'
  }
  return complements[element] || 'balanced'
}

function getCompatibleElement(element: string): string {
  const compatible: Record<string, string> = {
    Wood: 'Water or Fire',
    Fire: 'Wood or Earth',
    Earth: 'Fire or Metal',
    Metal: 'Earth or Water',
    Water: 'Metal or Wood'
  }
  return compatible[element] || 'complementary'
}

function getCareerField(element: string): string {
  const fields: Record<string, string> = {
    Wood: 'education, healthcare, or creative industries',
    Fire: 'entertainment, marketing, or leadership roles',
    Earth: 'real estate, food industry, or counseling',
    Metal: 'technology, finance, or engineering',
    Water: 'media, travel, or artistic pursuits'
  }
  return fields[element] || 'meaningful work'
}

function getElementReputation(element: string): string {
  const rep: Record<string, string> = {
    Wood: 'innovation and compassion',
    Fire: 'charisma and vision',
    Earth: 'reliability and wisdom',
    Metal: 'excellence and integrity',
    Water: 'creativity and insight'
  }
  return rep[element] || 'authenticity'
}

function getElementSkill(element: string): string {
  const skills: Record<string, string> = {
    Wood: 'strategic planning and growth',
    Fire: 'presentation and inspiration',
    Earth: 'relationship building',
    Metal: 'analysis and precision',
    Water: 'adaptability and communication'
  }
  return skills[element] || 'diverse talents'
}

function getElementAbility(dayMaster: string): string {
  return 'see patterns and possibilities that others miss'
}

function getCareerRole(element: string): string {
  const roles: Record<string, string> = {
    Wood: 'development and mentorship',
    Fire: 'leadership and public facing',
    Earth: 'management and operations',
    Metal: 'technical and specialist',
    Water: 'creative and advisory'
  }
  return roles[element] || 'impactful positions'
}

function getDayMasterLoveStyle(dayMaster: string): string {
  return 'deeply devoted and thoughtfully attentive'
}

function getElementLoveLanguage(element: string): string {
  const languages: Record<string, string> = {
    Wood: 'acts of service and quality time',
    Fire: 'words of affirmation and physical touch',
    Earth: 'gifts and acts of service',
    Metal: 'quality time and words of affirmation',
    Water: 'quality time and physical touch'
  }
  return languages[element] || 'authentic connection'
}

function getElementEmotionalNeed(element: string): string {
  const needs: Record<string, string> = {
    Wood: 'space for growth and expression',
    Fire: 'recognition and appreciation',
    Earth: 'security and consistency',
    Metal: 'respect and independence',
    Water: 'emotional depth and understanding'
  }
  return needs[element] || 'genuine connection'
}

function getElementRelationshipNeed(element: string): string {
  const needs: Record<string, string> = {
    Wood: 'growth opportunities',
    Fire: 'excitement and passion',
    Earth: 'stability and comfort',
    Metal: 'respect and honesty',
    Water: 'emotional connection'
  }
  return needs[element] || 'balance'
}

export async function POST(request: Request) {
  try {
    const { submissionId, sectionKey } = await request.json()
    
    if (!submissionId || !sectionKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Verify payment
    const { data: payment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('submission_id', submissionId)
      .eq('status', 'completed')
      .single()
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment required' },
        { status: 403 }
      )
    }
    
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
    
    // Check if section already generated
    const { data: existingReport } = await supabase
      .from('reports')
      .select('facts')
      .eq('submission_id', submissionId)
      .eq('section_key', sectionKey)
      .single()
    
    if (existingReport) {
      return NextResponse.json({ facts: existingReport.facts })
    }
    
    // Get previous facts for context
    const { data: previousReports } = await supabase
      .from('reports')
      .select('facts')
      .eq('submission_id', submissionId)
      .eq('is_free', false)
    
    const previousFacts: Fact[] = previousReports?.flatMap(r => r.facts) || []
    
    // Generate new facts for this section
    const facts = generateSectionFacts({
      sectionKey,
      submission: submission as Submission,
      previousFacts
    })
    
    // Store the facts
    await supabase
      .from('reports')
      .insert({
        submission_id: submissionId,
        payment_id: payment.id,
        section_key: sectionKey,
        facts,
        is_free: false
      })
    
    return NextResponse.json({ facts })
  } catch (error) {
    console.error('[v0] Generate section error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

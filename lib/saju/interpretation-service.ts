import { createClient } from "@/lib/supabase/server"

export interface ComboInterpretation {
  combo_key: string
  combo_type: string
  description: string
  keywords: string[]
}

export interface Terminology {
  category: string
  term_key: string
  term_name: string
  description: string
  keywords: string[]
}

// 십성 조합 해설 가져오기
export async function getComboInterpretations(sipsung: string[]): Promise<ComboInterpretation[]> {
  const supabase = await createClient()
  
  // 십성 조합 키 생성 (예: 비견+식신, 식신+편재 등)
  const comboKeys: string[] = []
  for (let i = 0; i < sipsung.length; i++) {
    for (let j = i + 1; j < sipsung.length; j++) {
      // 두 방향 모두 확인 (비견+식신, 식신+비견)
      comboKeys.push(`${sipsung[i]}+${sipsung[j]}`)
      comboKeys.push(`${sipsung[j]}+${sipsung[i]}`)
    }
  }
  
  if (comboKeys.length === 0) return []
  
  const { data, error } = await supabase
    .from("saju_combo_interpretations")
    .select("*")
    .in("combo_key", comboKeys)
  
  if (error) {
    console.error("콤보 해설 조회 오류:", error)
    return []
  }
  
  return data || []
}

// 용어 해설 가져오기 (카테고리별)
export async function getTerminology(category: string, keys: string[]): Promise<Terminology[]> {
  const supabase = await createClient()
  
  if (keys.length === 0) return []
  
  const { data, error } = await supabase
    .from("saju_terminology")
    .select("*")
    .eq("category", category)
    .in("term_key", keys)
  
  if (error) {
    console.error("용어 해설 조회 오류:", error)
    return []
  }
  
  return data || []
}

// 일간 해설 가져오기
export async function getDayMasterInterpretation(dayStem: string): Promise<Terminology | null> {
  const results = await getTerminology("일간", [dayStem])
  return results[0] || null
}

// 십성 해설 가져오기
export async function getSipsungInterpretations(sipsung: string[]): Promise<Terminology[]> {
  const uniqueSipsung = [...new Set(sipsung)]
  return getTerminology("십성", uniqueSipsung)
}

// 12운성 해설 가져오기
export async function get12UnseongInterpretations(unseong: string[]): Promise<Terminology[]> {
  const uniqueUnseong = [...new Set(unseong)]
  return getTerminology("12운성", uniqueUnseong)
}

// 신살 해설 가져오기
export async function getSinsalInterpretations(sinsal: string[]): Promise<Terminology[]> {
  const uniqueSinsal = [...new Set(sinsal)]
  return getTerminology("신살", uniqueSinsal)
}

// 사주 분석에 필요한 모든 해설 데이터 가져오기
export async function getAllInterpretationsForSaju(
  dayStem: string,
  sipsung: string[],
  unseong12: string[],
  sinsal: string[]
): Promise<{
  dayMaster: Terminology | null
  sipsungList: Terminology[]
  unseongList: Terminology[]
  sinsalList: Terminology[]
  comboList: ComboInterpretation[]
}> {
  const [dayMaster, sipsungList, unseongList, sinsalList, comboList] = await Promise.all([
    getDayMasterInterpretation(dayStem),
    getSipsungInterpretations(sipsung),
    get12UnseongInterpretations(unseong12),
    getSinsalInterpretations(sinsal),
    getComboInterpretations(sipsung)
  ])
  
  return {
    dayMaster,
    sipsungList,
    unseongList,
    sinsalList,
    comboList
  }
}

// 해설 데이터를 GPT 프롬프트용 문자열로 변환
export function formatInterpretationsForPrompt(interpretations: {
  dayMaster: Terminology | null
  sipsungList: Terminology[]
  unseongList: Terminology[]
  sinsalList: Terminology[]
  comboList: ComboInterpretation[]
}): string {
  const sections: string[] = []
  
  // 일간 해설
  if (interpretations.dayMaster) {
    sections.push(`[일간 해설]\n${interpretations.dayMaster.term_name}: ${interpretations.dayMaster.description}`)
  }
  
  // 십성 해설
  if (interpretations.sipsungList.length > 0) {
    const sipsungStr = interpretations.sipsungList
      .map(t => `- ${t.term_name}: ${t.description}`)
      .join("\n")
    sections.push(`[십성 해설]\n${sipsungStr}`)
  }
  
  // 12운성 해설
  if (interpretations.unseongList.length > 0) {
    const unseongStr = interpretations.unseongList
      .map(t => `- ${t.term_name}: ${t.description}`)
      .join("\n")
    sections.push(`[12운성 해설]\n${unseongStr}`)
  }
  
  // 신살 해설
  if (interpretations.sinsalList.length > 0) {
    const sinsalStr = interpretations.sinsalList
      .map(t => `- ${t.term_name}: ${t.description}`)
      .join("\n")
    sections.push(`[신살 해설]\n${sinsalStr}`)
  }
  
  // 십성 콤보 해설
  if (interpretations.comboList.length > 0) {
    const comboStr = interpretations.comboList
      .map(c => `- ${c.combo_key}: ${c.description}`)
      .join("\n")
    sections.push(`[십성 조합 해설]\n${comboStr}`)
  }
  
  return sections.join("\n\n")
}

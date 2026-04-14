import { createClient } from "@/lib/supabase/server"

// 실제 DB 구조에 맞춘 타입
export interface TerminologyRow {
  id: number
  category: string
  term_name: string
  genz_text: string
  keywords: string
  created_at: string
}

export interface ComboInterpretation {
  combo_key: string
  combo_type: string
  description: string
  keywords: string[]
}

// 카테고리 매핑 (코드에서 사용하는 이름 -> DB 카테고리)
const CATEGORY_MAP: Record<string, string> = {
  "일간": "일간(Day)",
  "십성": "십성(10Gods)",
  "12운성": "12운성",
  "신살": "12신살",
  "특수신살": "특수신살",
  "길성": "길성/귀인"
}

// 일간 매핑 (천간 한자 -> DB term_name 패턴)
const DAY_STEM_MAP: Record<string, string> = {
  "甲": "甲",
  "乙": "乙",
  "丙": "丙",
  "丁": "丁",
  "戊": "戊",
  "己": "己",
  "庚": "庚",
  "辛": "辛",
  "壬": "壬",
  "癸": "癸",
  "갑": "甲",
  "을": "乙",
  "병": "丙",
  "정": "丁",
  "무": "戊",
  "기": "己",
  "경": "庚",
  "신": "辛",
  "임": "壬",
  "계": "癸"
}

// 용어 해설 가져오기 (카테고리별, 부분 일치)
export async function getTerminologyByCategory(category: string): Promise<TerminologyRow[]> {
  const supabase = await createClient()
  const dbCategory = CATEGORY_MAP[category] || category
  
  const { data, error } = await supabase
    .from("saju_terminology")
    .select("*")
    .eq("category", dbCategory)
  
  if (error) {
    console.error("[v0] 용어 해설 조회 오류:", error)
    return []
  }
  
  return data || []
}

// 일간 해설 가져오기
export async function getDayMasterInterpretation(dayStem: string): Promise<TerminologyRow | null> {
  const supabase = await createClient()
  const searchChar = DAY_STEM_MAP[dayStem] || dayStem
  
  const { data, error } = await supabase
    .from("saju_terminology")
    .select("*")
    .eq("category", "일간(Day)")
    .ilike("term_name", `%${searchChar}%`)
    .limit(1)
  
  if (error) {
    console.error("[v0] 일간 해설 조회 오류:", error)
    return null
  }
  
  return data?.[0] || null
}

// 십성 해설 가져오기
export async function getSipsungInterpretations(sipsung: string[]): Promise<TerminologyRow[]> {
  const supabase = await createClient()
  const uniqueSipsung = [...new Set(sipsung)]
  
  if (uniqueSipsung.length === 0) return []
  
  const { data, error } = await supabase
    .from("saju_terminology")
    .select("*")
    .eq("category", "십성(10Gods)")
  
  if (error) {
    console.error("[v0] 십성 해설 조회 오류:", error)
    return []
  }
  
  // term_name에서 십성 이름 매칭
  return (data || []).filter(row => 
    uniqueSipsung.some(s => row.term_name.includes(s))
  )
}

// 12운성 해설 가져오기
export async function get12UnseongInterpretations(unseong: string[]): Promise<TerminologyRow[]> {
  const supabase = await createClient()
  const uniqueUnseong = [...new Set(unseong)]
  
  if (uniqueUnseong.length === 0) return []
  
  const { data, error } = await supabase
    .from("saju_terminology")
    .select("*")
    .eq("category", "12운성")
  
  if (error) {
    console.error("[v0] 12운성 해설 조회 오류:", error)
    return []
  }
  
  return (data || []).filter(row => 
    uniqueUnseong.some(u => row.term_name.includes(u))
  )
}

// 신살 해설 가져오기 (12신살 + 특수신살 + 길성/귀인)
export async function getSinsalInterpretations(sinsal: string[]): Promise<TerminologyRow[]> {
  const supabase = await createClient()
  const uniqueSinsal = [...new Set(sinsal)]
  
  if (uniqueSinsal.length === 0) return []
  
  const { data, error } = await supabase
    .from("saju_terminology")
    .select("*")
    .in("category", ["12신살", "특수신살", "길성/귀인"])
  
  if (error) {
    console.error("[v0] 신살 해설 조회 오류:", error)
    return []
  }
  
  return (data || []).filter(row => 
    uniqueSinsal.some(s => row.term_name.includes(s) || row.genz_text.includes(s))
  )
}

// 십성 조합 해설 가져오기
export async function getComboInterpretations(sipsung: string[]): Promise<ComboInterpretation[]> {
  const supabase = await createClient()
  
  const comboKeys: string[] = []
  for (let i = 0; i < sipsung.length; i++) {
    for (let j = i + 1; j < sipsung.length; j++) {
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
    console.error("[v0] 콤보 해설 조회 오류:", error)
    return []
  }
  
  return data || []
}

// 사주 분석에 필요한 모든 해설 데이터 가져오기
export async function getAllInterpretationsForSaju(
  dayStem: string,
  sipsung: string[],
  unseong12: string[],
  sinsal: string[]
): Promise<{
  dayMaster: TerminologyRow | null
  sipsungList: TerminologyRow[]
  unseongList: TerminologyRow[]
  sinsalList: TerminologyRow[]
  comboList: ComboInterpretation[]
}> {
  console.log("[v0] DB 해설 조회 시작:", { dayStem, sipsung, unseong12, sinsal })
  
  const [dayMaster, sipsungList, unseongList, sinsalList, comboList] = await Promise.all([
    getDayMasterInterpretation(dayStem),
    getSipsungInterpretations(sipsung),
    get12UnseongInterpretations(unseong12),
    getSinsalInterpretations(sinsal),
    getComboInterpretations(sipsung)
  ])
  
  console.log("[v0] DB 해설 조회 결과:", {
    dayMaster: dayMaster ? "있음" : "없음",
    sipsungCount: sipsungList.length,
    unseongCount: unseongList.length,
    sinsalCount: sinsalList.length,
    comboCount: comboList.length
  })
  
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
  dayMaster: TerminologyRow | null
  sipsungList: TerminologyRow[]
  unseongList: TerminologyRow[]
  sinsalList: TerminologyRow[]
  comboList: ComboInterpretation[]
}): string {
  const sections: string[] = []
  
  // 일간 해설 (Gen Z 스타일)
  if (interpretations.dayMaster) {
    sections.push(`[일간 캐릭터 - 반드시 참고!]\n${interpretations.dayMaster.term_name}: ${interpretations.dayMaster.genz_text}`)
  }
  
  // 십성 해설
  if (interpretations.sipsungList.length > 0) {
    const sipsungStr = interpretations.sipsungList
      .map(t => `- ${t.term_name}: ${t.genz_text}`)
      .join("\n")
    sections.push(`[십성 해설 - 반드시 참고!]\n${sipsungStr}`)
  }
  
  // 12운성 해설
  if (interpretations.unseongList.length > 0) {
    const unseongStr = interpretations.unseongList
      .map(t => `- ${t.term_name}: ${t.genz_text}`)
      .join("\n")
    sections.push(`[12운성 해설]\n${unseongStr}`)
  }
  
  // 신살 해설
  if (interpretations.sinsalList.length > 0) {
    const sinsalStr = interpretations.sinsalList
      .map(t => `- ${t.term_name}: ${t.genz_text}`)
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
  
  const result = sections.join("\n\n")
  console.log("[v0] 포맷된 해설 길이:", result.length)
  
  return result
}

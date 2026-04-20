'use client'

import Image from 'next/image'
import { getDayMasterCharacter, type DayMasterCharacter } from '@/lib/day-master-characters'

// Hanja to Korean stem mapping
const HANJA_TO_KOREAN: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
}

// Day master one-liner quotes
const DAY_MASTER_QUOTE: Record<string, string> = {
  '갑': 'Just goes for it. The path? I\'ll make one.',
  '을': 'Plant me anywhere. I\'ll bloom.',
  '병': 'The vibe shifts the moment I walk in.',
  '정': 'You\'ll open up before you even realize it.',
  '무': 'Lean on me. I\'m not going anywhere.',
  '기': 'Somehow everything just gets taken care of.',
  '경': 'Blunt? Sure. But also always right.',
  '신': 'It\'s not overthinking. It\'s called having standards.',
  '임': 'Goes wherever life takes them. And it\'s always interesting.',
  '계': 'Already knew how you felt before you said a word.',
}

interface DayMasterCardProps {
  dayMaster: string  // Can be Korean (갑) or Hanja (甲)
  dayMasterKorean?: string  // 갑목, 기토 등 전체 명칭
}

export function DayMasterCard({ dayMaster, dayMasterKorean }: DayMasterCardProps) {
  // Normalize to Korean (if hanja, convert; if already korean, use as-is)
  const koreanStem = HANJA_TO_KOREAN[dayMaster] || dayMaster
  const character = getDayMasterCharacter(koreanStem)
  const quote = DAY_MASTER_QUOTE[koreanStem] || ''
  
  // Fallback if character not found
  if (!character) {
    return (
      <div className="text-center py-4">
        <p className="text-white/60">Day Master: {dayMaster}</p>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col items-center text-center">
      {/* Character Image */}
      <div className="relative w-28 h-28 mb-3">
        <Image
          src={character.imagePath}
          alt={`${koreanStem} character`}
          fill
          className="object-contain drop-shadow-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/characters-collection.png'
          }}
        />
      </div>
      
      {/* Day Master Name */}
      <p className={`text-lg font-bold mb-0.5 ${character.color}`}>
        {character.stemHanja} {koreanStem}{character.element}
      </p>
      
      {/* Theme Title */}
      <p className="text-sm font-semibold text-foreground/90 mb-1">
        {character.themeTitle}
      </p>
      
      {/* Theme Description */}
      <p className="text-xs text-muted-foreground/80 mb-2">
        {character.themeDescription}
      </p>
      
      {/* Keywords */}
      <div className="flex flex-wrap justify-center gap-1.5 mb-3">
        {character.keywords.map((keyword, index) => (
          <span 
            key={index}
            className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full text-white/70"
          >
            #{keyword}
          </span>
        ))}
      </div>
      
      {/* One-liner quote */}
      {quote && (
        <p className="text-xs text-muted-foreground italic px-4">
          &ldquo;{quote}&rdquo;
        </p>
      )}
    </div>
  )
}

// 작은 버전 (미리보기용)
export function DayMasterCardCompact({ dayMaster, dayMasterKorean }: DayMasterCardProps) {
  const koreanStem = HANJA_TO_KOREAN[dayMaster] || dayMaster
  const character = getDayMasterCharacter(koreanStem)
  
  if (!character) {
    return (
      <div className="text-center py-2">
        <p className="text-white/60 text-sm">Day Master: {dayMaster}</p>
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-xl p-4">
      {/* Character Image */}
      <div className="relative w-20 h-20 flex-shrink-0">
        <Image
          src={character.imagePath}
          alt={`${koreanStem} character`}
          fill
          className="object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/characters-collection.png'
          }}
        />
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`text-xl font-bold ${character.color}`}>
            {character.stemHanja} {koreanStem}{character.element}
          </h3>
        </div>
        <p className="text-sm font-medium text-white/90 mb-1">
          {character.themeTitle}
        </p>
        <div className="flex flex-wrap gap-1">
          {character.keywords.slice(0, 2).map((keyword, index) => (
            <span 
              key={index}
              className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] text-white/70"
            >
              #{keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import Image from 'next/image'
import { getDayMasterCharacter, type DayMasterCharacter } from '@/lib/day-master-characters'

interface DayMasterCardProps {
  dayMaster: string  // 갑, 을, 병 등 천간 한글
  dayMasterKorean?: string  // 갑목, 기토 등 전체 명칭
}

export function DayMasterCard({ dayMaster, dayMasterKorean }: DayMasterCardProps) {
  const character = getDayMasterCharacter(dayMaster)
  
  if (!character) {
    return null
  }
  
  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-2xl p-6 text-center">
      {/* Character Image */}
      <div className="relative w-32 h-32 mx-auto mb-4">
        <Image
          src={character.imagePath}
          alt={`${dayMasterKorean || dayMaster} character`}
          fill
          className="object-contain drop-shadow-lg"
          onError={(e) => {
            // 이미지 로드 실패 시 대체 이미지
            (e.target as HTMLImageElement).src = '/images/characters-collection.png'
          }}
        />
      </div>
      
      {/* Day Master Name */}
      <div className="mb-3">
        <h3 className={`text-2xl font-bold ${character.color}`}>
          {dayMasterKorean || `${dayMaster}${character.element === '목' ? '목' : character.element === '화' ? '화' : character.element === '토' ? '토' : character.element === '금' ? '금' : '수'}`}
        </h3>
        <p className="text-sm text-white/60">
          {character.stemHanja} · {character.yinYang}{character.element}
        </p>
      </div>
      
      {/* Theme Title */}
      <h4 className="text-lg font-semibold text-white mb-1">
        {character.themeTitle}
      </h4>
      <p className="text-sm text-white/70 mb-4">
        {character.themeDescription}
      </p>
      
      {/* Keywords */}
      <div className="flex flex-wrap justify-center gap-2">
        {character.keywords.map((keyword, index) => (
          <span 
            key={index}
            className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80"
          >
            {keyword}
          </span>
        ))}
      </div>
    </div>
  )
}

// 작은 버전 (미리보기용)
export function DayMasterCardCompact({ dayMaster, dayMasterKorean }: DayMasterCardProps) {
  const character = getDayMasterCharacter(dayMaster)
  
  if (!character) {
    return null
  }
  
  return (
    <div className="flex items-center gap-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-xl p-4">
      {/* Character Image */}
      <div className="relative w-20 h-20 flex-shrink-0">
        <Image
          src={character.imagePath}
          alt={`${dayMasterKorean || dayMaster} character`}
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
            {dayMasterKorean || dayMaster}
          </h3>
          <span className="text-xs text-white/50">
            {character.stemHanja}
          </span>
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
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

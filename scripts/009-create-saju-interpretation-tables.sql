-- 사주 콤보 해설 테이블
CREATE TABLE IF NOT EXISTS saju_combo_interpretations (
  id SERIAL PRIMARY KEY,
  combo_formula TEXT NOT NULL,           -- 예: "식신 + 정재", "비겁다자 + 관살혼잡"
  meaning TEXT,                          -- 명리학적 의미
  genz_interpretation TEXT NOT NULL,     -- Gen Z 스타일 해설
  category TEXT DEFAULT 'combo',         -- combo, deficiency, excess, special
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사주 용어 해설 테이블
CREATE TABLE IF NOT EXISTS saju_terminology (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,                -- 일간, 십성, 12운성, 신살, 일주, 합충, 오행, 에너지강도
  term_code TEXT NOT NULL,               -- 예: "갑", "비견", "목욕", "천을귀인", "갑자"
  term_name TEXT,                        -- 한자 포함 이름 (예: "甲 (갑목)")
  summary TEXT,                          -- 핵심 요약
  genz_interpretation TEXT NOT NULL,     -- Gen Z 스타일 해설
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_combo_formula ON saju_combo_interpretations(combo_formula);
CREATE INDEX IF NOT EXISTS idx_combo_category ON saju_combo_interpretations(category);
CREATE INDEX IF NOT EXISTS idx_term_category ON saju_terminology(category);
CREATE INDEX IF NOT EXISTS idx_term_code ON saju_terminology(term_code);

-- 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_term_cat_code ON saju_terminology(category, term_code);

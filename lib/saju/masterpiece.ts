// =====================================================
// SAJU MASTERPIECE GUIDE - 여기에 전체 내용을 붙여넣으세요
// =====================================================
// 이 파일을 열고 전체 내용을 교체해주세요.
// 아래는 임시 placeholder입니다.

export const SAJU_MASTERPIECE_GUIDE = {
  metadata: {
    author: "Modern Mystic American Gen-Z Marketer",
    goal: "Reproducible, logical, and evidence-based Saju report"
  },

  // [핵심 로직] 9단계 분석 엔진
  engine_logic: {
    step_01_accuracy: "Check Seasonal boundaries (Ip-chun) and Standard Time offsets.",
    step_02_day_master: "Define by Reaction Structure (Symbol -> Reaction -> Risk). Must link to Root/Season.",
    step_03_ten_gods: "Translate to 'Psychological Function'. Analyze Presence (Surface) vs. Potential (Root).",
    step_04_strength: "Declare Evidence: Evidence of Deuk-ryeong, Deuk-ji, Deuk-se (min 3 sentences).",
    step_05_frame: "Declare School: Primary(Gyeok-guk) -> Secondary(Eok-bu) -> Tertiary(Jo-hu).",
    step_06_yongsin: "Define as 'OS Patch'. Strategy to reduce cost and fix imbalances.",
    step_07_dynamics: "Interpret Hap/Chung/Hyung as 'State Transitions' (Stress/Opportunity) in specific life domains.",
    step_08_shinsal: "Use as 'Description Lens' only. Enhance detail, do not let it override core structure.",
    step_09_advice: "Strategy Document: Must link to Yongsin, Timing (Dae-un), and Risk Mitigation."
  },

  // [계량화] 120점 채점 표준 (Position Weights)
  scoring_system: {
    total_score: 120,
    weights: {
      heavenly_stems: 10, // Each stem (Year, Month, Day, Hour)
      earthly_branches: {
        month: 30, // Most critical (Seasonal influence)
        day: 20,   // Self/Spouse foundation
        hour: 20,  // Future/Goal result
        year: 10   // Root/Ancestry
      }
    },
    correction_process: [
      "Position Weight Sum",
      "Seasonal Correction (Deuk-ryeong)",
      "Root Correction (Tong-geun/Hidden Stems)",
      "Interaction Correction (Hap/Chung)"
    ]
  },

  // [출력 규격] Sentence Architecture
  output_framework: {
    structure: "Traditional Definition -> Modern Interpretation (Gen Z) -> Actionable Strategy.",
    rule_1: "1:1 Linkage: Every metaphor must point to a Saju data point.",
    rule_2: "Narrative of Deficiency: Deficiency -> Psychological Reaction -> Behavior Pattern -> Strategic Alternative.",
    rule_3: "Quantified Evidence: Always show the data pointer (e.g., 月支, 藏干) at the end of each claim."
  },

  // [모듈] 커리어 & 재물 로직
  module_career: {
    priority: "Function (Role) -> Industry (Field) -> Format (Employment).",
    mapping: {
      ten_gods: "Determines Job Function (e.g., Bi-beom = Independent, Sik-sang = Producer)",
      five_elements: "Determines Industry (e.g., Wood = Edu/Startup, Water = Logistics/IT)",
      strength_level: "Determines Work Format (Strong = Founder/Pro, Weak = Org/Stable)"
    }
  },
  // [1] 커리어 해석 엔진 (Career Logic)
  career: {
    dna_priority: "1. Month Branch (Environment) -> 2. Ten Gods (Function) -> 3. Elements (Industry) -> 4. Strength (Format)",

    // [1] Five Elements Detailed Analysis (Industry & Health)
    elements: {
      "Wood (木)": {
        tendency: "Challenge, growth-oriented, high ideals",
        recommended_jobs: ["Education", "Startups", "Design", "Arts", "Planning"],
        excess_symptoms: "Strong stubbornness, lack of execution (planning only), fatigue in Liver/Gallbladder/Eyes",
        deficiency_symptoms: "Lack of challenge/initiative, weak creativity, weak muscular strength"
      },
      "Fire (火)": {
        tendency: "Passion, expression, brightness/cheerfulness",
        recommended_jobs: ["Media", "Entertainment", "YouTuber", "Psychological Counseling", "Design"],
        excess_symptoms: "Severe mood swings, impulsiveness, tiring others out, sensitivity in Blood Pressure/Heart",
        deficiency_symptoms: "Lack of passion/expressiveness, poor blood circulation, general lethargy"
      },
      "Earth (土)": {
        tendency: "Stability, balance, trust, prudence",
        recommended_jobs: ["Real Estate", "Administration", "Consulting", "Food Industry", "Brokerage"],
        excess_symptoms: "Excessive worrying, indecisiveness, overly conservative, Stomach/Digestive issues",
        deficiency_symptoms: "Lack of stability/sense of reality, weakened immunity"
      },
      "Metal (金)": {
        tendency: "Decision-making, self-discipline, analytical, logical",
        recommended_jobs: ["Public Office", "Military/Police/Law", "Medical", "Legal", "Tax/Accounting", "Finance"],
        excess_symptoms: "Lack of emotional expression, perfectionism, coldness, dry skin, weak Lungs",
        deficiency_symptoms: "Lack of logic, emotional/impulsive behavior, vulnerability in Respiratory system (Rhinitis/Asthma)"
      },
      "Water (水)": {
        tendency: "Wisdom, flexibility, contemplation/deep thinking",
        recommended_jobs: ["Education", "Biotechnology", "Invention", "IT/Tech", "Research", "Writing/Author"],
        excess_symptoms: "Overthinking/worrying, low execution, burden on Kidneys, body swelling/edema (coldness)",
        deficiency_symptoms: "Lack of wisdom/intuition, fear of change, weak bones, accelerated aging"
      }
    },

    // [2] Ten Gods Detailed Analysis (Psychology & Career Function)
    ten_gods: {
      "Bi-beom (Self/Comparison)": {
        needs: "Independence psychology / Leadership",
        recommended_jobs: ["Entrepreneur", "Freelancer", "Sales", "Politics", "Sports"],
        advantage_10_40: "Proactivity, strong presence, ability to exert influence",
        excess_50_plus: "Stubbornness/egoism, ignoring others' opinions, dogmatic behavior → Needs practice in respecting others' opinions"
      },
      "Sik-sang (Output/Creativity)": {
        needs: "Expression psychology / Creativity",
        recommended_jobs: ["Arts", "Culinary", "Broadcasting", "Marketing", "YouTuber"],
        advantage_10_40: "Artistic talent, eloquence, proactive movement",
        excess_50_plus: "Fickleness, hating rules, meddling (nosy), mood swings → Needs goal setting and building patience"
      },
      "Jae-seong (Wealth/Reality)": {
        needs: "Realistic psychology / Achievement of wealth",
        recommended_jobs: ["Sales", "Investment", "Trade", "Finance", "Real Estate"],
        advantage_10_40: "Strategic and realistic sense, ability to capture wealth/opportunities",
        excess_50_plus: "Obsession with material things, overspending (especially Pyeon-jae), excessive greed → Financial management (delegate to spouse recommended)"
      },
      "Gwan-seong (Rule/Honor)": {
        needs: "Discipline psychology / Pursuit of honor",
        recommended_jobs: ["Civil Servant", "Administration", "Military/Police/Law", "Security", "Management"],
        advantage_10_40: "Principles, order, ethics, strong sense of responsibility",
        excess_50_plus: "Perfectionism, excessive stress, rigidity → Needs flexible thinking and learning to relax"
      },
      "In-seong (Resource/Knowledge)": {
        needs: "Exploration psychology / Academic/Expertise",
        recommended_jobs: ["Research", "Psychological Counseling", "Education", "Philosophy", "IT Planning"],
        advantage_10_40: "Intellectual curiosity, intuition, academic achievement",
        excess_50_plus: "Lack of execution, 'lone wolf' (hermit) tendency, excessive worrying → Needs action over thinking and setting realistic goals"
      }
    },

    // 강약에 따른 고용 형태 (Format)
    format: {
      Strong: "Self-Employed / Founder / Independent Project",
      Weak: "Organization / Stable Structure / System-Dependent"
    }
  },

  // [2] 연애 및 배우자 엔진 (Relationship Logic)
  relationship: {
    core_rule: "Relationship is 'Function', not just emotion.",
    roles_by_ten_gods: {
      "Bi-beom": "Equal/Competitive/Friend-like",
      "Sik-sang": "Expressive/Affectionate/Nurturing",
      "Jae-seong": "Possessive/Responsible/Realistic",
      "Gwan-seong": "Regulatory/Structured/Marriage-centric",
      "In-seong": "Protective/Dependent/Stable"
    },
    day_branch_analysis: {
      Hap: "Binding / Attraction / Connection",
      Chung: "Conflict / Change / Potential Separation",
      Wonjin_Hae: "Emotional Accumulation / Toxic Distance"
    },
    visibility_hierarchy: ["1. Heavenly Stems (Social)", "2. Main Branch (Reality)", "3. Hidden Stems (Inner)"]
  },

  // [3] 가족 및 건강 가이드 (Family & Health)
  family_and_health: {
    family_model: "Family members as 'Role Models', not emotional narratives. Link In-seong to protection/environment.",
    health_ethic: "Symbolic indicators only. MANDATORY: 'Consult a medical professional for symptoms.'",
    health_mapping: {
      Wood: "Liver / Gallbladder / Eyes",
      Fire: "Heart / Blood Pressure / Mental",
      Earth: "Stomach / Digestion / Immunity",
      Metal: "Lungs / Skin / Respiratory",
      Water: "Kidney / Bladder / Circulation"
    }
  },

  // [4] 2026년 및 타임라인 엔진 (Timeline Logic)
  timeline_2026: {
    year_cycle: "2026: Byeong-o (丙午) - Intense Fire Energy.",
    analysis_steps: [
      "1. Check Byeong-o interaction with Day Master (Clash/Hap).",
      "2. Synthesize with Current Dae-un (Fortune Cycle).",
      "3. Apply Action Rules based on Yong-sin/Gi-sin status."
    ],
    event_scoring: {
      Career: "In-seong/Gwan-seong interaction",
      Wealth: "Jae-seong/Sik-sang interaction",
      Relationship: "Gwan-seong(F)/Jae-seong(M) interaction"
    }
  },

  // [5] 리스크 관리 및 톤앤매너 (Ethics & Tone)
  ethics: {
    tone: "Metaphor + Fact-bomb + Coaching. Avoid violent labeling.",
    risk_handling: "Always pair 'Fact-bomb' with a 'Strategic Alternative'.",
    purpose: "Not Fate, but 'Life Strategy Design'."
  },
  // [1] 일간 (Day Master)
  day_master: {
    "甲 (갑목)": { keywords: "직진, 리더십, 고집", genz_text: "Main Character Energy (주인공 재질). 내가 곧 법이고 룰임. 굽히느니 부러지겠다는 뚝심의 소유자." },
    "乙 (을목)": { keywords: "생존력, 유연함, 잡초", genz_text: "눈치 만렙 서바이버. 겉으로는 'Soft Girl/Boy' 미학인데 속은 강철 멘탈. 밟아도 다시 일어나는 끈기." },
    "丙 (병화)": { keywords: "스포트라이트, 열정", genz_text: "인간 태양 등장. 어딜 가나 스포트라이트 받아야 직성이 풀리는 E 성향의 끝판왕. 텐션 폼 미쳤음." },
    "丁 (정화)": { keywords: "은은한 매력, 온기", genz_text: "플러팅 장인. 은은하게 스며드는 인센스 스틱 같은 매력인데, 빡치면 촛불에서 산불로 변함." },
    "戊 (무토)": { keywords: "듬직, 스케일, 둔감", genz_text: "인간 바위. 타격감 제로의 묵직함. 웬만한 어그로에는 흔들리지 않는 멘탈 갑. 은근슬쩍 다 지켜보고 있음." },
    "己 (기토)": { keywords: "포용력, 실속, 비밀", genz_text: "모두의 엄마(Mothering) 역할을 자처하지만 자기 통장 잔고는 절대 안 알려줌. Lowkey(은근히) 야망캐." },
    "庚 (경금)": { keywords: "의리, 팩폭, 단호함", genz_text: "선 넘으면 바로 손절. 의리에 죽고 사는 마피아 재질. 돌려 말하기 절대 못하는 팩트 폭격기." },
    "辛 (신금)": { keywords: "완벽주의, 예민, 보석", genz_text: "인간 샤넬. 예민하고 까칠한데 본업 존잘이라 아무도 못 건드림. 피곤할 정도의 미학적 완벽주의자." },
    "壬 (임수)": { keywords: "스케일, 지혜, 속마음", genz_text: "생각의 깊이가 마리아나 해구 급. 겉보기엔 칠(Chill)한데 속으로는 우주 정복 계획 세우는 중." },
    "癸 (계수)": { keywords: "지혜, 유연함, 흑막", genz_text: "맑은 눈의 광인. 조용히 상황 다 지켜보고 있는 빅데이터 두뇌. 웃으면서 자기 몫 제일 잘 챙김." }
  },

  // [2] 십성 (10 Gods)
  ten_gods_kr: {
    "비견": { keywords: "독립, 마이웨이, 짱친", genz_text: "Squad Goals. 내 사람에겐 진심이지만 기본적으로 '나 홀로 Slay'하는 걸 즐기는 찐 독립적 영혼." },
    "겁재": { keywords: "경쟁심, 쟁취, 투쟁", genz_text: "경쟁심 MAX. Haters are confused fans (날 싫어하는 애들은 사실 내 팬임). 남의 떡이 커 보이면 뺏어와야 직성이 풀림." },
    "식신": { keywords: "힐링, 미식, 덕질", genz_text: "Living for the little treats (소소한 보상으로 사는 중). 맛집 탐방과 나만의 덕질이 세상을 구한다고 믿음." },
    "상관": { keywords: "반항, 관종, 말빨", genz_text: "Cancel culture 생존자. 말로 사람 뼈 때리는 재능 보유. 룰은 깨라고 있는 거 아니야?" },
    "편재": { keywords: "큰돈, 스케일, 플렉스", genz_text: "Hustle culture / Crypto bro 바이브. 욜로(YOLO) 하다가 골로 갈 수 있지만 일단 스케일 크게 놀고 봄." },
    "정재": { keywords: "안정, 짠테크, 소유", genz_text: "Quiet luxury (조용한 럭셔리) 추구. 짠테크의 달인이자 가성비에 미친 자. 내 돈 내산 철저함." },
    "편관": { keywords: "스트레스, 카리스마, 폼", genz_text: "Trauma dump (상처 썰 풀기) 장인인데 결국 성공해서 복수하는 서사. 인생 난이도 하드 모드지만 간지폭발." },
    "정관": { keywords: "룰, 명예, 체면", genz_text: "선생님 말씀 잘 듣는 모범생 재질인데 은근히 챙길 거 다 챙김. Red flag(위험 신호)는 귀신같이 피함." },
    "편인": { keywords: "마이너, 영감, 게으름", genz_text: "Niche internet celebrity (틈새 인터넷 셀럽). 방구석에서 오컬트나 마이너한 취미 파고드는 오타쿠 기질." },
    "정인": { keywords: "사랑받음, 눈치, 권리", genz_text: "숨만 쉬어도 사람들이 입양(?)하고 싶어 하는 애완인간 재질. 눈치 백단이라 사랑받는 법을 기가 막히게 앎." }
  },

  // [3] 12운성 (Life Stages)
  life_stages: {
    "목욕(도화)": { keywords: "시선 집중, 매력, 변덕", genz_text: "걸어 다니는 Thirst trap(매력 어필). 가만히 있어도 어그로 끌리는 타고난 인플루언서 운명." },
    "관대": { keywords: "패기, 근자감, 고집", genz_text: "Delulu is the solulu (망상이 곧 해결책). 근거 없는 자신감으로 똘똘 뭉쳐 일단 직진하는 청춘의 패기." },
    "제왕": { keywords: "정점, 권력, 안하무인", genz_text: "I'm the Boss. 남 밑에서 일 못 하는 병에 걸림. 능력은 쩔지만 가끔 꼰대 짓 주의보." },
    "절/태": { keywords: "백지, 변덕, 리셋", genz_text: "인생 리셋 버튼 수시로 누름. 방금 전까지 울다가 지금은 웃는 롤러코스터 감정선." },
    "장생": { keywords: "후원, 성장, 사랑받음", genz_text: "막내 온 탑. 가만히 숨만 쉬어도 사람들이 둥가둥가 키워주는 '럭키비키' 라이프의 정석." },
    "건록": { keywords: "자립, 프로페셔널", genz_text: "자수성가 아이콘. '내돈내산'으로 이뤄내는 갓생 살기의 표본. 남한테 아쉬운 소리 하는 거 극혐함." },
    "쇠/병": { keywords: "노련함, 공감, 쇠퇴", genz_text: "영혼 나이 80세. 세상 다 산 듯한 바이브로 친구들 연애 상담 전담하는 애어른 재질." },
    "사/묘": { keywords: "정신세계, 집요함, 수집", genz_text: "Niche(니치) 덕후. 남들 안 파는 거 깊게 파고드는 정보력 만렙. 한 번 꽂히면 무덤까지 가져감." },
    "양": { keywords: "보호, 육성, 평온", genz_text: "인간 인큐베이터. 남 챙겨주고 보살피는 데 재능 있음. 잔잔하고 평화로운 일상을 추구하는 힐링캐." }
  },

  // [4] 12신살 & 특수신살 (Shinsal & Special Shinsal)
  shinsal: {
    "지살/역마": { keywords: "이동, 유학, 바쁨", genz_text: "Catch flights, not feelings (감정 낭비할 바엔 비행기 탄다). 역마살 껴서 한 곳에 정착 못 하는 프로 방랑러." },
    "망신살": { keywords: "구설수, 흑역사, 노출", genz_text: "이불킥 마일리지 적립 중. 근데 이 흑역사가 오히려 나중에 떡상하는 썰(Ssul)이 될 수 있음." },
    "화개살": { keywords: "고독, 예술, 재결합", genz_text: "구남친/구여친 연락 오게 만드는 특유의 아련한 바이브. 고독을 즐기는 고독한 예술가 재질." },
    "장성살": { keywords: "리더십, 중심, 통제", genz_text: "어딜 가나 과대, 팀장, 총무 맡는 팔자. 남들 챙기느라 내 멘탈은 갈리지만 권력은 달콤함." },
    "겁살": { keywords: "투쟁, 빼앗김, 쟁취", genz_text: "눈 뜨고 코 베이거나, 내가 남의 코 베어오거나. 방심하면 털리는 야생의 서바이벌 게임 중." },
    "천살": { keywords: "불가항력, 이상, 억까", genz_text: "억까의 연속. 우주가 날 상대로 몰래카메라 하는 것 같지만, 이거 버티면 멘탈 다이아몬드 됨." },
    "천을귀인": { keywords: "최고 수호신, 로또", genz_text: "Literal Plot Armor (주인공 보정 버프). 우주가 나서서 내 인생 멱살 잡고 하드캐리 해주는 인생 치트키." },
    "현침살": { keywords: "독설, 디테일, 기술", genz_text: "내 혓바닥은 메스(Scalpel). 팩트로 사람 명치 때리는 1타 강사. 이 예민함으로 돈을 벌어야 함." },
    "백호대살": { keywords: "폭발력, 하드코어, 피", genz_text: "0 to 100 real quick. 평소엔 얌전하다가 빡치면 눈 돌아감. 에너지 드링크 10캔 마신 듯한 폭발력." },
    "귀문관살": { keywords: "빙의, 천재, 집착", genz_text: "Hyper-fixation (과몰입) 시대. 꽂히면 끝장을 보며, 남들 못 보는 걸 뚫어 보는 소름 돋는 촉." },
    "자미원진": { keywords: "애증, 꽁함, 원망", genz_text: "Toxic trait (나의 톡식한 버릇): 5년 전 일 꺼내서 혼자 빡치기. 내 머릿속에 누군가 월세 없이 살고 있음(Rent-free)." },
    "홍염살/도화": { keywords: "치명적 매력, 끼", genz_text: "Serving absolute C*nt (압도적인 매력 발산). 의도치 않게 플러팅 장인이 되어버리는 유죄 인간." },
    "효신살": { keywords: "엄마와 애증, 의존", genz_text: "마마보이/마마걸 바이브. 엄마랑 싸우고 엄마한테 하소연하는 무한 루프. 독립이 시급합니다." },
    "공망": { keywords: "허무, 밑빠진 독, 정신", genz_text: "The void is screaming (공허함이 날 부름). 뭔가 채워도 채워지지 않는 블랙홀 같은 마음. 정신승리가 답." },
    "의처의부살": { keywords: "집착, 의심, 통제", genz_text: "상대방 폰 몰래 보고 혼자 소설 쓰는 타입. 불안형 애착의 끝판왕. Trust issue(신뢰 문제) 극복 요망." },
    "년살(도화)": { keywords: "시선 집중, 인기, 끼", genz_text: "아이돌 센터 바이브. 내가 원하든 원하지 않든 사람들의 시선이 나한테 꽂히는 무대 체질." },
    "탕화살": { keywords: "화상, 감정폭발, 욱", genz_text: "감정 스위치 고장 난 불도저. 홧김에 일 저지르고 후회하는 게 일상. 화기 엄금, 마인드 컨트롤 필수." },
    "천라지망": { keywords: "구속, 슬럼프, 철학", genz_text: "슬럼프 구간 진입. 억지로 발버둥 치면 더 꼬임. 방구석에서 자기 계발하며 때를 기다려야 하는 타임아웃." },
    "괴강살": { keywords: "카리스마, 리더십, 극단", genz_text: "Alpha Energy (알파 에너지). 기가 너무 세서 귀신도 피해 감. 짱 먹거나 리더 안 하면 몸에 병남." },
    "간여지동": { keywords: "똥고집, 자아 비대", genz_text: "내 말이 곧 법. 자아 비대증 살짝 있음. 남의 조언 절대 안 듣고 일단 내가 부딪혀봐야 직성이 풀리는 마이웨이." },
    "단장관": { keywords: "외모, 미적 감각, 치장", genz_text: "OOTD 장인. 꾸미는 데 진심이며 거적때기를 입어도 명품처럼 소화하는 미친 미적 감각의 소유자." },
    "음인/양인살": { keywords: "승부욕, 칼, 불도저", genz_text: "인간 불도저. 꽂히면 뒤도 안 돌아보고 밀어붙이는 노빠꾸. 가끔 브레이크가 고장 나니 멘탈 브레이크 필수." },
    "나체도화": { keywords: "치명적 매력, 구설수", genz_text: "유죄 인간 그 자체. 숨만 쉬어도 플러팅이 되는 옴므/팜므파탈. 연애사 복잡해질 수 있으니 선 긋기 필수." },
    "신병살": { keywords: "예민, 영감, 건강 주의", genz_text: "개복치 멘탈. 스트레스 받으면 몸부터 아픔. 영적 촉이 너무 좋아서 쎄한 느낌은 무조건 백발백중." },
    "곡각살": { keywords: "끈기, 뼈/관절, 꺾임", genz_text: "꺾이지 않는 마음인데 진짜 뼈가 꺾일 수 있음. 거북목, 디스크, 뼈 관절 주의! 필라테스나 스트레칭 필수." },
    "금신": { keywords: "결단력, 냉혹함, 돌파", genz_text: "사이다 결단력. 우유부단함 제로. 아닌 건 아니라고 단칼에 쳐내는 카리스마로 위기 돌파." },
    "낙정관살": { keywords: "함정, 구설수, 조심", genz_text: "길 가다 맨홀 빠질 관상. 조용히 꿀 빨려다 오히려 독박 쓸 수 있으니 돌다리도 레이저로 지져보고 건너기." },
    "구추방해": { keywords: "아홉 번의 방해, 극복", genz_text: "인생이 넷플릭스 막장 드라마. 시련이 끝이 없는데 결국 다 뚫고 나가는 K-드라마 캔디 주인공." },
    "뇌공타뇌관": { keywords: "벼락, 돌발 상황, 충격", genz_text: "서프라이즈 파티의 연속. 예고 없이 터지는 사건 사고 속에서 미친 순발력으로 살아남는 트러블 슈터." },
    "교신성/비인살": { keywords: "고독, 외교, 은밀함", genz_text: "군중 속의 고독. 겉으로는 핵인싸인데 집에 오면 배터리 0% 됨. 은밀하게 협상하고 판을 짜는 지략가." },
    "진신/퇴신": { keywords: "전진/후퇴, 타이밍", genz_text: "치고 빠지기의 달인. 언제 엑셀을 밟고 언제 브레이크를 밟아야 하는지 본능적으로 아는 타이밍 귀재." },
    "여연살/남연살": { keywords: "이성 인연, 연애사", genz_text: "가만히 있어도 디엠(DM) 터짐. 이성들이 자석처럼 꼬이는 타고난 연애 세포. 환승 연애 찍기 딱 좋음." },
    "음욕살/육수": { keywords: "감성, 욕망, 다재다능", genz_text: "감성 핀터레스트 재질. 본능과 욕구에 충실하며 다재다능함으로 사람들을 홀리는 묘한 매력의 소유자." },
    "장군전": { keywords: "스케일, 지휘, 통솔", genz_text: "방구석 제갈공명. 스케일이 남달라서 쪼잔하게 안 놂. 큰 물에서 놀면서 판을 지휘해야 하는 야망캐." },
    "칠살": { keywords: "압박, 호랑이, 빡센 환경", genz_text: "갓생 강제 모드. 숨 돌릴 틈 없이 빡센 미션이 주어지지만, 이거 버티고 깨면 레벨업 보상은 확실한 하드코어 퀘스트." },
    "재살(수옥살)": { keywords: "갇힘, 눈치, 두뇌 회전", genz_text: "방탈출 게임 고인물. 꽉 막힌 답답한 상황에서도 미친 두뇌 회전으로 어떻게든 빠져나갈 구멍을 찾아내는 생존마." },
    "일귀": { keywords: "일주 귀인, 특별한 보호", genz_text: "나만의 퍼스널 가디언. 남들 다 억까 당하고 망할 때 혼자 살아남는 기적의 쉴드(Shield) 발동." },
    "음양살": { keywords: "음양 불균형, 매력, 굴곡", genz_text: "낮져밤이 or 낮이밤져? 반전 매력 오지는데 감정 기복도 심해서 텐션 맞추기 살짝 빡센 타입." },
    "일덕": { keywords: "덕성, 평온, 인복", genz_text: "인성 논란 0%. 바른 생활 사나이/소녀 재질이라 주변에서 믿고 쓰는 인간 보증수표. 결국 착한 놈이 이긴다." }
  },

  // [5] 합/충 & 특수조합 (Dynamics & Combinations)
  dynamics: {
    "사미반합": { keywords: "화 기운 팽창, 열정", genz_text: "여름날의 불기둥. 텐션이 우주를 뚫고 나감. 의기투합하면 못 할 게 없지만 금방 지칠 수 있음." },
    "신자진 삼합": { keywords: "거대한 물결, 연대", genz_text: "Vibe match (완벽한 티키타카). 물방울이 모여 쓰나미가 되는 거대한 스케일의 인간관계 형성." },
    "축오 원진/해": { keywords: "폭발, 미움, 스트레스", genz_text: "물과 불의 끔찍한 혼종. 만났다 하면 서로 킹받게(Triggering) 하는 환장의 콜라보." },
    "병임충": { keywords: "수화 상극, 변동", genz_text: "Big beef (엄청난 갈등). 하늘의 태양과 바다가 부딪히는 스펙터클한 스릴러. 인생의 급발진 구간." },
    "천간합": { keywords: "끌림, 생산, 결합", genz_text: "눈맞음 주의. 자석의 N극과 S극처럼 운명적으로 확 끌리는 치명적인 케미 폭발 구간." },
    "지지육합/방합": { keywords: "소울메이트, 패밀리", genz_text: "영혼의 단짝. 말 안 해도 통하는 찐친 바이브. 우리 식구 건드리면 다 죽는다는 조폭급 의리." },
    "형 (인사신/축술미)": { keywords: "조정, 수술, 갈등 해결", genz_text: "피 튀기는 회의실. 서로 뼈 때리고 싸우면서 결국엔 기가 막힌 합의점 찾아내는 스파르타식 조정 기간." },
    "천간충/지지충": { keywords: "정면 돌파, 변화, 깨짐", genz_text: "노빠꾸 급발진. 정면 돌파로 판을 다 엎어버리는 다이내믹 에너지. 인생의 대격변이 일어나는 스릴러." },
    "파/해": { keywords: "방해, 미움, 꼬임", genz_text: "내부 분열. 겉으로는 웃는데 속으로는 딴생각하는 아슬아슬한 살얼음판. 통수 조심, 배신 조심." },
    "자형 (진진, 오오...)": { keywords: "자기 학대, 집착, 완벽주의", genz_text: "자기 객관화 멈춰! 누가 시키지도 않았는데 스스로 기준을 너무 높게 잡아서 자기 자신을 제일 피곤하게 볶아먹음." },
    "지지 삼합/방합": { keywords: "목적 지향, 완벽한 연대", genz_text: "어벤져스 어셈블. 각자 다른 놈들 셋이 모였는데 팀플 효율 200% 나오는 미친 시너지 효과." },
    "무례지형 (자묘형)": { keywords: "무례함, 선 넘음, 구설", genz_text: "선 넘네? 인간관계에서 은근히 예의 밥 말아먹은 킹받는 상황이 발생함. 친할수록 팩폭 자제하고 선 지키기 필수." },
    "원진살 (일반)": { keywords: "애증, 미움, 끌림", genz_text: "혐관(혐오 관계) 맛집. 이유 없이 끌리는데 만나면 기 빨림. 내 머릿속에 누군가 월세 없이 살고 있는 애증의 굴레." },
    "반합 (삼합의 절반)": { keywords: "부분적 연대, 가성비", genz_text: "가성비 듀오. 셋이 모여야 완벽한데 둘만 있어도 얼추 굴러감. 2% 부족하지만 실속은 다 챙기는 꿀조합." },
    "무관 사주": { keywords: "자유, 무규칙, 프리랜서", genz_text: "룰 브레이커. 9 to 6 사무실에 갇히면 숨 막혀 죽는 병 있음. 내 인생의 CEO는 무조건 나." },
    "무재 사주": { keywords: "결과 부족, 욜로, 무소유", genz_text: "돈 개념 로그아웃. 과정을 즐기지만 결과물 챙기는 데는 젬병. 강제 저축 안 하면 텅장 지름길." },
    "무은지형 (인사신)": { keywords: "배신, 은혜 저버림", genz_text: "통수 주의보. 내가 간 쓸개 다 빼준 사람이 갑자기 안면 몰수하는 환장의 배신물 시나리오." },
    "지세지형 (축술미)": { keywords: "세력 다툼, 기싸움", genz_text: "서열 정리 폼 미쳤음. 서로 자존심 걸고 '누가 더 쎄냐' 기싸움하다가 피 터지는 권력 투쟁." },
    "천간충": { keywords: "정신적/이념적 충돌", genz_text: "사상 검증 키배(키보드 배틀) 중. 현실 타격보다는 가치관이나 멘탈이 부딪혀서 속으로 개빡치는 상황." },
    "지지충": { keywords: "현실적/물리적 충돌", genz_text: "현실 인프라 강제 리셋. 이사, 이직, 부서 이동 등 내 환경이 스펙터클하게 뒤집어지는 물리적 급발진." },
    "육합": { keywords: "1:1의 은밀한 결합", genz_text: "비밀 연애 or 은밀한 동맹. 남들 눈 피해서 우리 둘만 아는 시그널 보내며 꿍꿍이 꾸미는 찰떡 케미." },
    "방합 / 방합(부분)": { keywords: "혈연, 지연, 세력", genz_text: "우리가 남이가? 친목질과 패밀리십으로 똘똘 뭉친 세력. 든든하긴 한데 룰에서 벗어나기 힘든 K-혈연 바이브." }
  },
  // [2] 길성 및 귀인 (Auspicious Stars & Noble Benefactors)
  auspicious_stars: {
    "문창살/학당귀인": { keywords: "두뇌, 학문, 글쓰기", genz_text: "인간 챗GPT. 뇌섹남녀 재질. 말빨이나 글로 사람 홀리는 스마트한 매력으로 먹고살 팔자." },
    "월덕/천덕귀인": { keywords: "인복, 천우신조", genz_text: "위기 탈출 넘버원. 이번 판은 망했다 싶을 때 기가 막히게 귀인이 나타나서 구출해 주는 축복받은 인생." },
    "태극귀인": { keywords: "초지일관, 대성", genz_text: "대기만성 레전드. '존버는 승리한다'의 산증인. 초반에 털려도 끝끝내 목표 달성하는 독기 가득 폼." },
    "천록귀인/암록": { keywords: "금전운, 숨은 조력", genz_text: "통장 잔고 마를 날이 없음. 어디선가 꽁돈이 자꾸 생기거나 남 몰래 나를 도와주는 찐팬이 있음." },
    "복성귀인/복신": { keywords: "행운, 조력자, 귀인", genz_text: "걸어 다니는 네잎클로버. 어딜 가나 먹을 복, 사람 복이 터지는 인생의 프리패스 티켓 소유자." }
  },
  // [5] 에너지 강도 (Energy Strength)
  energy_strength: {
    "신강 (극왕/태강/신강)": { keywords: "주관 뚜렷, 독립심, 고집", genz_text: "자존감 Max. '내 인생 내가 알아서 함' 마인드로 남 눈치 1도 안 보고 직진하는 멘탈 불도저." },
    "중화 (중화신강/중화신약)": { keywords: "밸런스, 융통성, 적응", genz_text: "황금 밸런스 유지 중. 너무 나대지도 않고 호구 잡히지도 않는 평화주의자이자 프로 사회생활러." },
    "신약 (신약/태약/극약)": { keywords: "눈치, 예민함, 유연함", genz_text: "기 빨림 주의. 멘탈이 쿠크다스라 주변 분위기에 잘 휩쓸리지만, 그만큼 눈치 빠르고 융통성 하나는 끝내줌." }
  },

  // [6] 사주 핵심 (Core Concepts)
  core_concepts: {
    "격국 (정관격, 편재격 등)": { keywords: "사회적 무기, 타고난 그릇", genz_text: "내 인생의 메인 직업(Class). 내가 이 세상에서 어떤 퀘스트를 깨야 제일 돈과 명예를 잘 버는지 알려주는 내비게이션." },
    "용신 (조후/억부)": { keywords: "수호신, 필요한 기운", genz_text: "인생 꿀템. 나한테 부족한 스탯을 꽉 채워주는 필수 영양제. 용신 들어오는 해에는 숨만 쉬어도 떡상함." },
    "조후용신": { keywords: "온도 조절, 조화", genz_text: "인생의 퍼스널 에어컨/히터. 내 사주가 쪄 죽거나 얼어 죽기 직전일 때, 온도 맞춰서 쾌적하게 만들어주는 구원템." },
    "억부용신": { keywords: "강약 조절, 밸런스", genz_text: "멘탈 밸런스 패치. 너무 나대면 눌러주고, 너무 쭈굴거리면 버프 걸어주는 1:1 맞춤형 인생 코칭." },
    "지장간 (HIDDEN_STEMS)": { keywords: "숨겨진 본성, 속마음", genz_text: "본캐 뒤에 숨겨진 은밀한 부캐. 겉모습(지지) 속에 감춰둔 진짜 내 찐 욕망이자 아무도 모르는 흑막." }
  },

  // [7] 운세 흐름 (Fortune Flow)
  fortune_flow: {
    "대운 (10년 주기)": { keywords: "10년 운세, 환경 변화", genz_text: "시즌 업데이트 완료. 10년마다 바뀌는 내 인생의 테마곡이자 배경 맵. 지금 내 운명 열차가 어디로 가는지 보여주는 메인 퀘스트." }
  },

  // [8] 오행 (The Five Elements - Basic Base)
  elements_base: {
    "木 (목 기운)": { keywords: "시작, 의욕, 성장", genz_text: "급발진 성장캐. 우주 끝까지 뻗어나가려는 잭과 콩나무 바이브. 폼 미친 실행력으로 일단 저지르고 봄." },
    "火 (화 기운)": { keywords: "확산, 열정, 표현력", genz_text: "인간 핫팩. 확 타오르는 열정 만수르. 조용히 살고 싶어도 숨길 수 없는 관종력과 저 세상 텐션." },
    "土 (토 기운)": { keywords: "중재, 포용, 무던함", genz_text: "인간 스펀지. 웬만한 억까는 다 받아주는 무던함. 근데 속마음은 며느리도 모르는 비밀스러운 미스터리." },
    "金 (금 기운)": { keywords: "결단, 원칙, 숙살", genz_text: "칼각의 정석. 맺고 끊음이 확실한 T 성향 팩트 폭격기. 차가워 보이지만 내 바운더리 안의 사람에겐 찐임." },
    "水 (수 기운)": { keywords: "지혜, 유연함, 휴식", genz_text: "물 흐르듯 Chill~함. 극한 상황에서도 살아남는 적응력 갑. 남들은 못 따라오는 생각의 깊이와 딥다크한 매력." }
  },
  // [3] 일주 (Il-ju Pillars)
  pillars: {
    "갑자 (甲子)": { keywords: "맑눈광, 도화, 순수", genz_text: "태초의 맑눈광(맑은 눈의 광인). 겉으론 고고한 소나무인데 속은 호기심 천국. 은근히 관종이라 나체도화의 치명적 매력을 흘리고 다님." },
    "갑술 (甲戌)": { keywords: "재물, 뚝심, 활인", genz_text: "가을 산의 외로운 늑대 재질. 돈 냄새 기가 막히게 맡는데, 내 바운더리 사람 건드리면 진짜 물어뜯음. 팩폭의 달인." },
    "갑신 (甲申)": { keywords: "스트레스, 극복, 하드코어", genz_text: "바위산에 뿌리내린 소나무. 인생 난이도 하드 모드지만 맷집 하나는 1티어. 억까 당할수록 레벨업하는 전투 민족." },
    "갑오 (甲午)": { keywords: "텐션 폭발, 표현력", genz_text: "브레이크 고장 난 스포츠카. 기분 좋으면 텐션 우주 뚫는데, 빡치면 잿더미로 만들어버림. 말로 사람 홀리는 언변의 마술사." },
    "갑진 (甲辰)": { keywords: "백호, 스케일, 거목", genz_text: "위풍당당 거목 그 자체. 은근히 '내가 왕이다' 마인드 장착. 백호살 특유의 카리스마로 무리에서 무조건 대장 먹어야 직성이 풀림." },
    "갑인 (甲寅)": { keywords: "간여지동, 황소고집", genz_text: "고집의 의인화. '내 인생 내가 알아서 해'의 표본. 꺾일지언정 굽히지 않는 강철 멘탈인데 가끔 부러질 때 타격이 큼." },
    "을축 (乙丑)": { keywords: "존버, 인내, 금신", genz_text: "얼어붙은 땅에 피어난 들꽃. 불꽃같은 존버 정신. 남들 다 포기할 때 혼자 악으로 깡으로 버텨서 결국 승리하는 K-직장인 최적화." },
    "을해 (乙亥)": { keywords: "유랑, 감수성, 부평초", genz_text: "물 위에 둥둥 떠다니는 수초 재질. 자유로운 영혼의 끝판왕. 감수성 터져서 밤마다 인스타 감성 글귀 올리다 아침에 빛삭함." },
    "을유 (乙酉)": { keywords: "예민보스, 바위 위 난초", genz_text: "칼날 위에 핀 꽃. 세상에서 제일 예민하고 까칠한데 그 미학적인 완벽함 때문에 사람들이 못 떠남. 찔리면 피 남 주의." },
    "을미 (乙未)": { keywords: "백호, 사막의 선인장", genz_text: "겉바속촉 츤데레. 메마른 사막에서도 살아남는 지독한 생존력. 돈 관리 엄청 빡세게 하며 '내 돈 내산'의 철칙을 지킴." },
    "을사 (乙巳)": { keywords: "플러팅 장인, 나체도화", genz_text: "걸어 다니는 인간 플러팅. 숨만 쉬어도 매력이 뚝뚝 떨어져서 의도치 않게 어장 관리남/녀로 오해받기 딱 좋은 유죄 인간." },
    "을묘 (乙卯)": { keywords: "끈질김, 간여지동, 잡초", genz_text: "눈치 만렙 멘탈 갑. 아무리 밟아도 다음 날 또 자라나는 끈질긴 생명력. 남 비위 잘 맞추는 척하면서 실속은 다 챙기는 알짜배기." },
    "병자 (丙子)": { keywords: "호수 위 태양, 의외의 소심", genz_text: "태양은 태양인데 물에 비친 태양. 겉으론 E 성향 관종인데, 속으론 '나 오늘 너무 나댔나?' 걱정하는 I 성향의 소유자." },
    "병술 (丙戌)": { keywords: "백호, 불꽃, 열정", genz_text: "서산으로 지는 붉은 노을. 평소엔 따뜻한데 한 번 꼭지 돌면 백호살 발동해서 다 엎어버리는 다이내믹한 성질머리." },
    "병신 (丙申)": { keywords: "다재다능, 문창, 재주꾼", genz_text: "재능 만수르. 머리 회전 핑퐁급이고 잔머리도 잘 굴림. 돈 냄새도 잘 맡아서 뭐 하나 꽂히면 무조건 결과물 뽑아내는 사기캐." },
    "병오 (丙午)": { keywords: "양인, 한여름 태양, 마라맛", genz_text: "맵다 매워 마라맛 인생! 천상천하 유아독존. 눈에 뵈는 거 없이 직진하는 태양 그 자체. 텐션 감당 가능한 사람만 접근 요망." },
    "병진 (丙辰)": { keywords: "관대, 일덕, 오지랖", genz_text: "구름 사이로 빛나는 태양. 은근히 남 챙겨주는 오지랖퍼인데 그게 밉지 않음. 식복 타고나서 어딜 가나 밥 굶을 일 없는 럭키걸/보이." },
    "병인 (丙寅)": { keywords: "장생, 홍염, 댕댕이", genz_text: "사랑받기 위해 태어난 골든 리트리버. 가만히 있어도 우쭈쭈 해주는 귀인들이 널림. 근데 화나면 은근히 성질 있음." },
    "정축 (丁丑)": { keywords: "백호, 용광로, 희생", genz_text: "꽁꽁 언 땅을 녹이는 모닥불. 겉으론 차분해 보이는데 속에는 활화산이 끓고 있음. 내 사람에겐 다 퍼주지만 배신하면 국물도 없음." },
    "정해 (丁亥)": { keywords: "천을귀인, 호수 위 달빛", genz_text: "별 헤는 밤의 감성 장인. 직관력과 영감이 쩔어서 남들 못 보는 걸 꿰뚫어 봄. 인생 치트키(천을귀인) 장착해서 위기 탈출 능력 만렙." },
    "정유 (丁酉)": { keywords: "천을귀인, 샹들리에", genz_text: "화려한 조명이 나를 감싸네. 럭셔리함의 인간화. 돈도 잘 벌고 미적 감각도 뛰어나서 가성비보단 '가심비'로 플렉스 하는 타입." },
    "정미 (丁未)": { keywords: "양인, 건조한 불, 승부욕", genz_text: "뜨거운 한여름의 용광로. 한 고집, 한 승부욕 함. 평소엔 은은한 조명 같다가 열받으면 주변 다 태워버리는 폭발력 주의." },
    "정사 (丁巳)": { keywords: "간여지동, 불기둥", genz_text: "노빠꾸 불기둥. 겉과 속이 전부 불꽃이라 타협 따윈 없음. 내 방식대로 내 길을 간다는 마이웨이 끝판왕. 추진력 미쳤음." },
    "정묘 (丁卯)": { keywords: "편인도화, 길냥이", genz_text: "까칠하고 예민한데 은근히 귀여운 길냥이 바이브. 생각 엄청 많고 밤에 감성 타는 스타일. 나만의 딥한 매력으로 마니아층 형성." },
    "무자 (戊子)": { keywords: "흙 속의 금고, 짠테크", genz_text: "산속에 숨겨둔 비밀 금고. 겉으론 세상 둔해 보이는데 머릿속에선 이미 손익 계산 끝남. 돈 절대 허투루 안 쓰는 가성비 헌터." },
    "무술 (戊戌)": { keywords: "괴강/백호, 거산, 절대 안 짐", genz_text: "아무도 못 건드리는 거대한 활화산. 포스 덜덜함. 누구한테 지는 거 죽기보다 싫어해서 한 번 싸우면 끝장 보는 파이터 기질." },
    "무신 (戊申)": { keywords: "문창, 다재다능, 가을 산", genz_text: "가을 산에 먹을 게 널렸네. 머리 팽팽 잘 돌아가고 손재주, 입담 다 갖춘 만능 엔터테이너. 근데 가만히 못 있어서 늘 바쁨." },
    "무오 (戊午)": { keywords: "양인, 화산 폭발", genz_text: "휴화산인 줄 알았는데 갑자기 폭발함. 평소엔 점잖은 척 다 하다가 스위치 눌리면 다 엎어버림. 스케일 하나는 우주 제일." },
    "무진 (戊辰)": { keywords: "백호/괴강, 큰 산, 자부심", genz_text: "신비로운 진흙 산. 자존심이 에베레스트급이라 남 밑에서 고개 숙이는 거 못함. 은근슬쩍 리더 자리 차지하는 본투비 보스." },
    "무인 (戊寅)": { keywords: "편관, 호랑이 탄 산, 명예욕", genz_text: "산군(호랑이)의 포스. 가오와 명예에 살고 죽음. 빡센 환경에 던져지면 더 날아다니는 이상한 체질. 일 중독 주의 요망." },
    "기축 (己丑)": { keywords: "존버, 황소고집, 얼어붙은 땅", genz_text: "한겨울 언 땅에서 버티는 멘탈 갑. 속을 도무지 알 수 없는 인간 포커페이스. 남들 포기할 때 혼자 끝까지 남아서 결과물 챙김." },
    "기해 (己亥)": { keywords: "역마, 진흙, 은밀한 실속", genz_text: "잔잔한 호수 밑의 진흙. 눈치 100단이라 상황 파악 기가 막히게 하고 요리조리 내 이득 다 챙김. 역마 껴서 은근히 바쁘게 돌아다님." },
    "기유 (己酉)": { keywords: "문창, 미식가, 금수저 재질", genz_text: "가을 들판의 황금보리. 먹을 복 타고난 미식가이자 예술적 감각의 소유자. 깔끔하고 예리해서 촌스럽고 멍청한 거 제일 싫어함." },
    "기미 (己未)": { keywords: "간여지동, 메마른 땅", genz_text: "사막의 모래바람. 타협이라곤 1도 모르는 똥고집. 남들 신경 안 쓰고 내 갈 길 가는 뚝심 덕에 결국엔 뭐라도 하나 이뤄냄." },
    "기사 (己巳)": { keywords: "금신, 겉유속강", genz_text: "겉은 부들부들한 흙인데 속은 시퍼런 칼날. 사람 좋아 보인다고 함부로 대했다간 팩폭으로 뼈도 못 추림. 눈치 엄청 빠름." },
    "기묘 (己卯)": { keywords: "편관, 예민보스, 들판 토끼", genz_text: "눈치 챙겨! 주변 상황에 레이더 켜고 있는 예민한 들토끼. 남들 시선 엄청 신경 쓰면서도 속으론 다 쳐내고 싶어 하는 피곤한 스타일." },
    "경자 (庚子)": { keywords: "차가운 팩폭러, 하얀 쥐", genz_text: "겨울 바다에 가라앉은 쇳덩이. 뼈 때리는 말 한마디로 사람 순살 만드는 팩트 살인마. 냉철하고 이성적인 T 성향의 극치." },
    "경술 (庚戌)": { keywords: "괴강, 의리파, 철벽", genz_text: "마피아 보스 재질. 내 바운더리 안의 사람은 무슨 일이 있어도 지키는 미친 의리. 근데 선 넘으면 두 번 다시 안 봄. 철벽 방어 갑." },
    "경신 (庚申)": { keywords: "간여지동, 강철검", genz_text: "인간 제설차. 앞에 거슬리는 거 있으면 다 밀어버리고 직진함. 융통성은 좀 떨어져도 그 투박하고 솔직한 맛에 사람들이 따름." },
    "경오 (庚午)": { keywords: "폼생폼사, 용광로 속 쇠", genz_text: "간지에 살고 간지에 죽는다. 제복이나 수트 입고 각 잡는 거 엄청 좋아함. 룰과 명예를 중시하는 모범생인데 은근히 관종임." },
    "경진 (庚辰)": { keywords: "괴강, 하얀 용, 스케일", genz_text: "구름 위를 나는 하얀 용. 스케일이 남달라서 쪼잔한 건 못 견딤. 직관력 쩔고 기가 쎄서 어딜 가나 한자리 해 먹을 팔자." },
    "경인 (庚寅)": { keywords: "사냥꾼, 편재, 큰돈", genz_text: "큰돈 노리는 야생의 사냥꾼. 쪼잔하게 월급 모으기보단 한방을 노리는 배포가 있음. 근데 돈이 들어온 만큼 확 나갈 수 있으니 주의." },
    "신축 (辛丑)": { keywords: "진흙 속 보석, 존버, 예민", genz_text: "진흙 묻은 다이아몬드. 지금 당장 안 빛난다고 무시 ㄴㄴ. 이 꽉 깨물고 버티다 결국 혼자서 화려하게 떡상하는 독기 가득캐." },
    "신해 (辛亥)": { keywords: "차가운 보석, 도화, 까칠", genz_text: "얼음물에 씻은 다이아. 맑고 투명한데 만지면 베일 듯이 차가움. 말 밉게 하는 재주가 있지만 그 까칠함이 묘하게 매력적인 유죄 인간." },
    "신유 (辛酉)": { keywords: "간여지동, 다이아몬드, 완벽주의", genz_text: "현미경 들이밀어도 흠집 없는 결벽증 보석. 완벽주의가 심해서 본인도 피곤하고 남도 피곤함. 내 자존심에 스크래치 내면 다 죽음." },
    "신미 (辛未)": { keywords: "모래 속 보석, 예리함", genz_text: "건조한 모래사장의 날카로운 유리 조각. 겉보기엔 얌전해 보여도 속엔 칼날을 품고 있음. 엄청 예리해서 남들 못 보는 디테일 다 잡아냄." },
    "신사 (辛巳)": { keywords: "정관, 불 속의 보석, 눈치백단", genz_text: "스포트라이트 받는 화려한 샹들리에. 눈치가 빛의 속도라 사회생활 만렙. 선 절대 안 넘고 우아하게 내 실속 다 챙기는 프로페셔널." },
    "신묘 (辛卯)": { keywords: "예리한 칼날, 싹둑", genz_text: "가위손 등장. 맘에 안 들면 인간관계든 일이든 칼같이 잘라버림. 돈 욕심은 많은데 멘탈이 살짝 쿠크다스라 멘탈 케어 필수." },
    "임자 (壬子)": { keywords: "양인, 쓰나미, 속을 모름", genz_text: "인간 쓰나미. 속을 도무지 알 수 없는 마리아나 해구. 한 번 터지면 걷잡을 수 없이 밀어붙이는 파괴력. 고집 꺾을 사람 지구상에 없음." },
    "임술 (壬戌)": { keywords: "백호/괴강, 끓는 물, 리더", genz_text: "댐에 갇힌 거대한 강물. 스케일 크고 추진력 쩔어서 무조건 대장 해야 함. 겉으로는 호탕한데 돈 관리 은근히 빡세게 하는 반전 매력." },
    "임신 (壬申)": { keywords: "마르지 않는 샘, 브레인", genz_text: "걸어 다니는 구글 검색기. 지적 호기심 쩔고 머리 엄청 비상함. 어떤 위기 상황에서도 요리조리 빠져나가는 미친 적응력의 소유자." },
    "임오 (壬午)": { keywords: "록마동향, 재물운, 은밀함", genz_text: "달밤의 로맨티스트인데 통장 잔고 빵빵함. 겉으론 한량 같은데 속으론 돈 되는 거 다 계산하고 있음. 타고난 복이 많아 평생 굶을 일 없음." },
    "임진 (壬辰)": { keywords: "괴강, 흑룡, 포스", genz_text: "어둠 속에서 꿈틀대는 흑룡. 기가 너무 쎄서 남들이 함부로 못 건드림. 리더십 쩔고 스케일 커서 남 밑에 있으면 병나는 체질." },
    "임인 (壬寅)": { keywords: "식신, 문창, 로맨티스트", genz_text: "봄비 내리는 숲속. 똑똑하고 감수성 터지는 낭만주의자. 먹는 거 좋아하고 즐기는 거 좋아해서 인생 피곤하게 사는 거 딱 질색함." },
    "계축 (癸丑)": { keywords: "백호, 얼음물, 한 성깔", genz_text: "한겨울 꽁꽁 언 얼음물. 겉으론 조용해 보이는데 건드리면 폭발하는 얼음 폭풍. 한 맺히면 복수 노트 적어두고 기필코 갚아줌." },
    "계해 (癸亥)": { keywords: "대해수, 천재성, 속을 모름", genz_text: "끝을 알 수 없는 심해. 음흉(?)할 정도로 속을 안 비쳐줌. 천재 아니면 바보 소리 듣는 극단적 두뇌. 뭐 하나 꽂히면 끝장 보는 덕후 기질." },
    "계유 (癸酉)": { keywords: "금수쌍청, 결벽증, 맑음", genz_text: "옹달샘에 빠진 다이아몬드. 너무 맑고 깨끗해서 결벽증 냄새 남. 뇌섹남녀 재질인데, 은근히 뼈 때리는 말 잘해서 상처 주기도 함." },
    "계미 (癸未)": { keywords: "묘지, 모래 스며든 물", genz_text: "사막에 스며든 한 줄기 물. 현실의 벽에 부딪혀도 어떻게든 틈새시장 공략해서 살아남는 지독한 끈기. 가끔 스트레스가 위장병으로 옴." },
    "계사 (癸巳)": { keywords: "천을귀인, 록마동향, 귀공자", genz_text: "인생 이지 모드. 천을귀인 버프 빵빵하게 받아서 어딜 가나 대접받는 귀공자/귀공녀 바이브. 머리 좋고 돈도 잘 만지는 육각형 인간." },
    "계묘 (癸卯)": { keywords: "장생, 천을귀인, 사랑받음", genz_text: "인간 비타민. 촉촉한 봄비 묻은 새싹. 존재 자체가 힐링이라 가만히 있어도 사람들이 예뻐해 줌. 럭키비키 긍정 회로의 아이콘." }
  },
  // [2] 위치별 십성 해석 (Ten Gods Analysis by Position)
  position_analysis: {
    // 비견 (Bi-gyeon)
    "비견_연주(초년)": { title: "마이웨이 조기졸업", genz_text: "어릴 때부터 남 눈치 1도 안 보고 내복 입고 돌아다녔을 재질. 일찍부터 독립심 만렙 찍어서 부모님 간섭 제일 싫어함." },
    "비견_월주(청년)": { title: "경쟁사회 서바이벌", genz_text: "사회생활 시작부터 빡센 경쟁 구도 돌입! 동료가 적인지 아군인지 헷갈림. 남 믿지 말고 내 실력으로 승부 봐야 떡상함." },
    "비견_일주(배우자)": { title: "짱친 같은 연애", genz_text: "배우자 자리에 짱친이 들어앉았네? 꽁냥꽁냥 로맨스보단 의리로 뭉친 전우애 부부. 구속하면 칼같이 도망가니 각자 라이프 존중 필수." },
    "비견_시주(말년)": { title: "마이웨이 독거노인?", genz_text: "말년까지 내 멋대로 산다! 늙어서도 자식 눈치 안 보고 내 취미 생활 쿨하게 즐김. 대신 주변에 사람 없어도 혼자 잘 놈." },

    // 식신 (Sik-sin)
    "식신_연주(초년)": { title: "본투비 먹방러", genz_text: "어릴 때부터 먹을 복, 입을 복 낭낭했음. 큰 굴곡 없이 오구오구 사랑받고 자라서 기본적으로 베이스가 긍정적임." },
    "식신_월주(청년)": { title: "내 취향이 곧 직업", genz_text: "덕업일치 최적화. 내가 좋아하는 거, 내 취향 파고들어서 돈 버는 재능 충만. 딱딱한 회사보단 프리랜서나 전문직이 찰떡." },
    "식신_일주(배우자)": { title: "사육하는 연애", genz_text: "상대방 밥 챙겨주고 다 퍼주는 '엄마/아빠' 연애. 너무 오냐오냐해서 상대방 버릇 나빠질 수 있으니 밀당 텐션 좀 챙겨야 함." },
    "식신_시주(말년)": { title: "갓벽한 노후", genz_text: "말년 운 폼 미쳤다. 나이 들어서도 내 일 하면서 여유롭게 맛집 투어 다니고, 자식복까지 터지는 평화로운 노후 예약." },

    // 편재 (Pyeon-jae)
    "편재_연주(초년)": { title: "조기 경제 관념", genz_text: "초딩 때부터 딱지 쳐서 용돈 벌었을 싹수. 일찍부터 돈 맛을 알거나, 집안에 굴곡(돈/아버지 관련)이 있었을 다이내믹 초년기." },
    "편재_월주(청년)": { title: "허슬러의 삶", genz_text: "월급 쟁이로 만족 못하는 크립토/주식 브로 재질. 한방을 노리는 배포가 큰데, 자칫하면 텅장 되니 멘탈이랑 시드머니 관리 빡세게!" },
    "편재_일주(배우자)": { title: "스펙터클 로맨스", genz_text: "잔잔한 연애? 놉! 영화 찍는 다이내믹 연애사. 돈 많거나 능력 쩌는 배우자 만날 확률 높은데, 상대방이 좀 통제 불능일 수 있음." },
    "편재_시주(말년)": { title: "부동산 갑부", genz_text: "노후에 건물주 바이브. 말년에 큰돈 만질 수 있는 스케일. 나이 들어서도 안방에 가만히 못 있고 밖으로 돈 벌러 돌아다님." },

    // 정관 (Jeong-gwan)
    "정관_연주(초년)": { title: "K-장녀/장남 재질", genz_text: "모범생 콤플렉스. 어릴 때부터 부모님, 선생님 말씀 엄청 잘 듣는 바른 생활 어린이. 일찍부터 내 체면 챙기느라 좀 피곤했음." },
    "정관_월주(청년)": { title: "정장 입는 사회생활", genz_text: "대기업, 공기업 프리패스 상. 남들 눈에 번듯해 보이는 직장 들어가야 맘 편함. 규칙 잘 지키고 승진도 스무스하게 하는 에이스." },
    "정관_일주(배우자)": { title: "FM 배우자", genz_text: "결혼 상대로 FM 정석인 사람 만남. 엄청 모험적인 사랑보단, 조건 맞고 남들 보기에 흠잡을 데 없는 '정상 궤도'의 결혼 추구." },
    "정관_시주(말년)": { title: "동네 반장님", genz_text: "나이 들어서도 명예욕 못 버림. 아파트 동대표나 노인정 회장님이라도 해야 직성 풀림. 존경받으며 품위 있게 늙어가는 말년." },

    // 편인 (Pyeon-in)
    "편인_연주(초년)": { title: "방구석 몽상가", genz_text: "어릴 때부터 '나는 누구, 여긴 어디?' 철학적 고민 달고 살음. 눈치 엄청 빠르고 애어른 소리 들으면서 자란 독특한 유년기." },
    "편인_월주(청년)": { title: "니치 마켓 덕후", genz_text: "남들 다 하는 흔한 건 죽어도 싫음. 마이너하고 딥한 분야(IT, 오컬트, 예술) 팠다가 그쪽에서 장인 소리 들으며 성공할 팔자." },
    "편인_일주(배우자)": { title: "묘한 애증 관계", genz_text: "의심병 환자들의 연애. 상대방 엄청 사랑하면서도 끊임없이 의심하고 테스트함. 예술적이고 독특한 4차원 파트너랑 엮이기 쉬움." },
    "편인_시주(말년)": { title: "산신령 바이브", genz_text: "말년에 철학관 차릴 상. 종교, 명상, 철학에 심취해서 세속적인 욕심 다 내려놓고 도 닦는 조용한 산신령 재질의 노후." },

    // 겁재 (Geob-jae)
    "겁재_연주(초년)": { title: "승부욕 조기교육", genz_text: "어릴 때부터 지는 걸 제일 싫어함. 형제/자매끼리 쟁탈전 빡세게 하거나 경쟁 치열한 환경에서 자란 생존형 멘탈." },
    "겁재_월주(청년)": { title: "피 튀기는 팀플", genz_text: "내 밥그릇 뺏으려는 놈들이 도처에 깔린 사회생활. 호구 잡히기 싫어서 강제로 전투력 만렙 찍고 독기 가득 품음." },
    "겁재_일주(배우자)": { title: "환장의 라이벌 연애", genz_text: "사랑꾼보단 라이벌에 가까운 텐션. 지기 싫어해서 부부싸움 하면 끝장을 봄. 같이 운동하거나 게임하면서 승부욕 풀어야 평화로움." },
    "겁재_시주(말년)": { title: "뺏길 수 없는 노후", genz_text: "나이 들어서도 폼 안 죽음. 자식한테 재산 뜯길(?) 수 있으니 노후 자금은 무조건 내 이름으로 꽉 묶어두고 안 뺏겨야 함." },

    // 상관 (Sang-gwan)
    "상관_연주(초년)": { title: "K-금쪽이 출신", genz_text: "어릴 때 부모님 말 제일 안 듣고 팩폭 날리던 반항아. 호기심 많고 오지랖 넓어서 동네 골목대장 한 번쯤 해봤음." },
    "상관_월주(청년)": { title: "프로 룰 브레이커", genz_text: "회사 규율? 그게 뭔데. 꼰대 상사 뼈 때리는 사이다 발언 장인. 정해진 틀에 갇히면 숨 막혀서 프리랜서나 내 사업이 딱임." },
    "상관_일주(배우자)": { title: "팩폭 로맨스", genz_text: "상대방 흠집 귀신같이 찾아내서 잔소리함. '너 잘되라고 하는 소리야'가 입버릇. 근데 또 은근히 챙겨주는 츤데레 매력." },
    "상관_시주(말년)": { title: "멋쟁이 실버", genz_text: "나이 들어서도 입바른 소리 작렬. 잔소리 폭격기라 주변이 피곤할 수 있음. 대신 트렌드 엄청 빨리 흡수하는 힙한 할매/할배." },

    // 정재 (Jeong-jae)
    "정재_연주(초년)": { title: "조기 재테크", genz_text: "어릴 때부터 세뱃돈 철저하게 저금하던 K-알뜰러. 금수저까진 아니어도 굴곡 없이 안정적인 환경에서 구김살 없이 자람." },
    "정재_월주(청년)": { title: "가성비 갓생", genz_text: "월급쟁이 최적화. 따박따박 들어오는 돈이 최고임. 영끌, 빚투 극혐하고 내 통장 잔고 보며 힐링하는 찐 안정 추구형." },
    "정재_일주(배우자)": { title: "내조/외조의 왕", genz_text: "배우자 자리에 ATM(?)이 있네. 경제 관념 철저하고 가정적인 사람 만남. 엄청난 로맨스보단 가계부 같이 쓰는 현실 부부." },
    "정재_시주(말년)": { title: "연금술사", genz_text: "노후 준비 끝판왕. 국민연금, 개인연금 따박따박 받으며 돈 걱정 없이 평화롭게 취미 생활 즐기는 갓벽한 말년." },
    "편관_연주(초년)": { title: "인생 조기 하드모드", genz_text: "어릴 때부터 빡센 환경이나 엄격한 부모님 밑에서 자람. 멘탈이 일찍 철들어서 웬만한 시련엔 타격도 안 받는 단단함." },
    "편관_월주(청년)": { title: "갓생 강박증", genz_text: "나를 극한으로 몰아붙이는 워커홀릭. 편한 길 놔두고 굳이 빡센 길 골라 감. 스트레스 만땅인데 또 그 맛에 성취감 느낌." },
    "편관_일주(배우자)": { title: "카리스마 파트너", genz_text: "나를 확 휘어잡는 기 쎈 배우자 만남. 가끔 숨 막히지만 능력 하나는 확실함. 묘하게 나쁜 남자/여자한테 끌리는 병 조심." },
    "편관_시주(말년)": { title: "늦깎이 열정", genz_text: "나이 들어서도 감투 하나 써야 직성 풀림. 봉사활동이나 단체장 하면서 빡세게 돌아다니느라 노후에도 쉴 틈 없이 바쁨." },
    "정인_연주(초년)": { title: "온실 속 화초", genz_text: "어릴 때 집안의 사랑 듬뿍 받고 자람. 엄마 치맛바람 살짝 있었을 수 있지만, 기본적으로 구김살 없는 도련님/아가씨 재질." },
    "정인_월주(청년)": { title: "사랑받는 금쪽이", genz_text: "사회생활에서도 윗사람이 알아서 챙겨주는 인복 만렙. 눈치 백단이라 미움 안 받고 실속 잘 챙기는데 은근히 게으름." },
    "정인_일주(배우자)": { title: "마미보이/걸 연애", genz_text: "나한테 엄마/아빠처럼 다 퍼주고 우쭈쭈 해주는 사람 만남. 편하긴 한데 내가 너무 의존해서 상대방이 지칠 수 있으니 주의." },
    "정인_시주(말년)": { title: "우아한 노후", genz_text: "말년에 학문, 독서, 예술 즐기면서 교양 있게 늙어감. 주변에서 대우받고 자식 효도받는 평화롭고 안락한 해피엔딩." }
  },
  // [2] 십성 조합 해석 (Ten Gods Combinations)
  combinations: {
    "식신 + 정재": { description: "안정적 재물 창출", genz_text: "소확행 재테크의 달인. 내가 좋아하는 취미로 따박따박 돈 버는 갓생. 모험은 안 하지만 절대 굶어 죽진 않음." },
    "식신 + 편재": { description: "사업적 재능 발휘", genz_text: "덕업일치 끝판왕. 재미로 시작한 일로 사업병 도져서 큰돈 만지는 스케일. 취미가 곧 돈줄이 되는 매직." },
    "상관 + 정재": { description: "언변으로 재물 획득", genz_text: "타고난 영업러. 기가 막힌 말빨과 쇼맨십으로 내 월급 알아서 척척 불려 나감. 입만 살았는데 그 입이 황금 입임." },
    "상관 + 편재": { description: "트렌드를 읽어 큰돈 범", genz_text: "인플루언서 커머스 재질. 요새 핫한 거 귀신같이 캐치해서 어그로 끌고 한탕 크게 땡김. 대신 버는 만큼 펑펑 씀." },
    "정재 + 정관": { description: "재생관 (안정적 승진)", genz_text: "K-직장인의 정석. 돈 모아서 내 체면 차리고, 회사에서 인정받는 FM 코스. 흠잡을 데 없지만 인생이 살짝 노잼임." },
    "편재 + 편관": { description: "재생살 (돈 써서 권력 얻음)", genz_text: "가오생 가오사. 명품 할부 긁어서라도 내 뽀대 유지해야 함. 스케일 크게 놀다가 빚더미에 앉을 수 있으니 폼 좀 죽이기." },
    "편재 + 정관": { description: "욜로 후 안정", genz_text: "열심히 놀다가도 때 되면 귀신같이 취업하고 승진함. 융통성 만렙이라 위에서 이뻐할 수밖에 없는 여우 같은 곰." },
    "정관 + 정인": { description: "관인상생 (정석적인 성공)", genz_text: "하이패스 승진상. 상사들이 알아서 내 뒤 봐주고 이끌어주는 프리패스 인생. 선생님 말씀 잘 들으면 떡 하나 더 나옴." },
    "편관 + 편인": { description: "살인상생 (시련 극복 후 장인)", genz_text: "인간 승리 서사. 헬파티 같은 부서/환경에서 멘탈 갈리며 존버했더니 어느새 그 구역 대체불가 전문가 되어있음." },
    "편관 + 정인": { description: "극한 환경 속 조력자", genz_text: "전쟁터에 떨어졌는데 헬기 타고 구호물자 날아옴. 개고생 하다가도 결정적일 때 윗사람 빽으로 위기 모면하는 천운." },
    "상관 + 정관": { description: "상관견관 (조직 파괴)", genz_text: "오피스 빌런 or 팩트 폭격기. 꼰대 상사 보면 못 참고 사이다 날려야 직성 풀림. 회식 자리에서 사장님 뼈 때리지 말 것." },
    "식신 + 편관": { description: "식신제살 (내 실력으로 위기 돌파)", genz_text: "트러블 슈터 등장. 남들 다 도망가는 폭탄 업무, 내가 들어가서 실력으로 하드캐리함. 위기를 기회로 만드는 영웅 재질." },
    "정재 + 정인": { description: "재극인 (도덕보단 돈)", genz_text: "머릿속에 계산기 돌아가는 현실주의자. 체면, 도덕 챙길 시간에 내 통장 잔고부터 챙기는 실속파. 돈 앞에서 공부 포기함." },
    "편재 + 편인": { description: "재극인 (잔머리 대마왕)", genz_text: "눈치 100단 얍삽이. 남들 생각 못 하는 틈새시장 공략해서 요리조리 돈 다 빼먹는 기발한 천재. 근데 사기꾼 조심." },
    "비견 + 정재": { description: "내돈내산, 분배", genz_text: "철저한 더치페이. 내 돈 소중한 줄 알아서 친구 사이에도 10원 단위로 N빵함. 자립심 강해서 남한테 아쉬운 소리 안 함." },
    "겁재 + 편재": { description: "투기, 베팅, 한탕주의", genz_text: "야수의 심장. 코인/주식에 시드머니 몰빵하는 상남자/상여자. 대박 아니면 쪽박인 롤러코스터 인생, 손절 타이밍이 생명임." },
    "편인 + 식신": { description: "편인도식 (게으른 완벽주의)", genz_text: "머릿속으론 이미 유니콘 기업 세웠는데 현실은 침대 위. 완벽하게 하려다 시작도 못 하고 내 밥그릇 내가 걷어차는 중." },
    "상관 + 편인": { description: "예술적 천재성, 기행", genz_text: "이해 불가 4차원 천재. 남들 다 '예' 할 때 '아니오'라며 기발한 거 들고나옴. 대중성은 없는데 마니아층이 미친 듯이 열광함." },
    "정인 + 식신": { description: "인성용식 (배운 걸 써먹음)", genz_text: "대학원 석박사급 지식을 실무에 찰떡같이 적용함. 배운 배운 티 팍팍 내면서 고상하게 밥그릇 챙기는 엘리트 코스." },
    "정관 + 식신": { description: "명예와 여유의 조화", genz_text: "대기업 다니면서 칼퇴하고 요가 다니는 워라밸 끝판왕. 직장에서도 적당히, 내 삶도 적당히 즐기는 황금 밸런스 유지자." },
    "비견 + 식신": { description: "크루 결성, 동업", genz_text: "나 혼자보단 맘 맞는 친구들이랑 으쌰으쌰 동업할 때 포텐 터짐. 팟캐스트나 밴드 만들어서 즐겁게 일하는 크루 문화 최적화." },
    "겁재 + 상관": { description: "반항 크루, 혁명가", genz_text: "기존 룰 다 부수고 다니는 스타트업 혁명가. 동료들이랑 작당 모의해서 새로운 판 짜는 거 좋아함. 근데 팀 내 불화 조심." },
    "비견 + 편관": { description: "극기, 친구와 고생", genz_text: "군대 동기 바이브. 빡센 환경에서 동료들과 전우애 다지며 생존함. 주변 친구들이 다 빡세고 전투적인 놈들뿐임." },
    "겁재 + 정관": { description: "경쟁자 통제", genz_text: "내 밥그릇 노리는 놈들 룰과 법으로 다 밟아버림. 경쟁 치열한 곳에서 결국 1짱 먹는 사내정치 만렙." },
    "인성 + 비겁": { description: "자아 비대칭, 팩트 수용 거부", genz_text: "내 생각이 무조건 맞음. 남들이 팩폭 때려도 귓등으로 안 듣고 정신승리 오짐. 멘탈은 방탄인데 발전이 없을 수 있음." },
    "식상 + 관성 혼합": { description: "치고받는 갈등", genz_text: "규칙을 깨려는 자(식상)와 지키려는 자(관성)의 자아분열. 회사 다니면서 맨날 퇴사 짤 찾아보는 K-직장인의 표본." },
    "재성 + 인성 혼합": { description: "돈 vs 양심의 딜레마", genz_text: "이걸 팔면 돈은 되는데 내 가오가 상하고.. 머릿속에서 도덕책이랑 엑셀표가 싸우는 중. 결정장애 올 확률 200%." },
    "관인 + 식상 결핍": { description: "수동적 순응자", genz_text: "시키는 건 완벽하게 하는데, '너 맘대로 해봐' 하면 뇌 정지 옴. 창의력 0%, 매뉴얼 없으면 아무것도 못 함." },
    "식재 + 인성 결핍": { description: "무지성 돌격대", genz_text: "일단 지르고 봄. 뒷수습 생각 안 하고 앞만 보고 달리는 덤프트럭. 브레이크 잡아줄 꼼꼼한 파트너 없으면 대형 사고 침." },
    "비식재관인 (오행구족)": { description: "풀템 장착", genz_text: "육각형 인간. 뭐 하나 빠지는 거 없이 다 중간 이상 감. 근데 너무 평탄해서 오히려 한 방의 임팩트가 부족한 노잼 인생일 수도." }
  },

  // [3] 결핍 및 과다 조합 (Deficiencies & Excess)
  special_dynamics: {
    "무관(無官) + 비겁다자": { description: "통제 불능 마이웨이", genz_text: "고집불통 핵마이웨이. 누가 내 인생에 훈수 두면 알레르기 반응 일어남. 회사 생활 절대 불가, 내 맘대로 프리랜서 해야 속 편함." },
    "무관(無官) + 식상다자": { description: "자유로운 영혼의 극치", genz_text: "오피스 알레르기 말기 환자. 룰 극혐, 간섭 극혐. 전 세계 떠도는 디지털 노마드나 예술가 안 하면 우울증 걸림." },
    "무관(無官) + 재성다자": { description: "간판 없는 부자", genz_text: "돈 버는 족족 명품이나 차에 다 박음. 실속은 챙기는데 남들 보여줄 번듯한 타이틀(간판)이 없어서 은근히 자격지심 생김." },
    "무관(無官) + 인성다자": { description: "방구석 철학자", genz_text: "생각은 이미 UN 사무총장인데 방구석을 안 나감. 사회 감각 제로, 현실 진출 의지 제로. 일단 알바라도 나가서 땀 좀 흘려야 함." },
    "무재(無財) + 비겁다자": { description: "만년 텅장", genz_text: "인맥은 쩌는데 내 지갑은 털림. 남 밥값 계산해주다가 정작 내일 낼 월세 없음. 무조건 강제 적금이나 부동산으로 돈 묶어야 삼." },
    "무재(無財) + 식상다자": { description: "과정만 즐기는 욜로", genz_text: "일 벌이는 데는 우사인 볼트, 수습하는 데는 나무늘보. '경험이 재산이지~' 정신승리 오지는데 통장 잔고 보면 눈물 남." },
    "무재(無財) + 관성다자": { description: "가오만 남은 명예", genz_text: "돈 안 되는 직함, 명예, 감투 쓰는 데 목숨 건 선비. 남들 보기에 번듯한데 까보면 마이너스 통장임. 현실 자각 시급함." },
    "무재(無財) + 인성다자": { description: "무소유의 삶", genz_text: "세속적 욕망 로그아웃. 돈 명예 다 부질없고 내 정신적 만족이 짱임. 종교인이나 학자로 살면 찰떡인데 자본주의에선 좀 피곤함." },
    "무식상(無食傷) + 인성다자": { description: "아웃풋 제로", genz_text: "인풋은 하버드생인데 아웃풋은 0. 입력만 오지게 하고 입 밖으로 표현을 못 해서 맨날 남한테 공 다 뺏김. 제발 말 좀 해!" },
    "무식상(無食傷) + 관성다자": { description: "조직의 부품", genz_text: "시키는 일은 알파고처럼 완벽하게 함. 근데 창의력 요구하면 에러 남. 노잼 인간 소리 들어도 안정적인 대기업/공무원이 천직임." },
    "무식상(無食傷) + 재성다자": { description: "요령 없는 몸테크", genz_text: "입 털어서 편하게 돈 버는 법을 모름. 무식하게 몸으로 때우거나 야근으로 갈아 넣어서 돈 버는 스타일. 요령 좀 피울 필요 있음." },
    "무식상(無食傷) + 비겁다자": { description: "묵언수행 뚝딱이", genz_text: "속엔 용암이 끓는데 겉으론 한 마디도 안 함. 감정 표현 뚝딱이라 오해 엄청 삼. 리액션 버튼 하나 장만하는 거 추천." },
    "무인성(無印星) + 식상다자": { description: "무지성 팩폭러", genz_text: "뇌 안 거치고 입으로 직행. 생각 안 하고 막 내뱉어서 남한테 상처 주고 뒤돌아서 후회함. 말하기 전에 3초만 참는 연습 요망." },
    "무인성(無印星) + 재성다자": { description: "브레이크 없는 자본주의", genz_text: "당장 내 눈앞에 떨어지는 현찰만 쫓음. 깊게 생각 안 하고 투자했다가 상투 잡고 물리기 딱 좋음. 사기꾼 조심, 문서 조심." },
    "무인성(無印星) + 관성다자": { description: "맨땅에 헤딩", genz_text: "윗사람 빽 1도 없음. 남들 낙하산 탈 때 혼자 정글도 들고 길 개척해야 함. 억울해도 어쩔 수 없음, 내 힘으로 올라가야 함." },
    "무인성(無印星) + 비겁다자": { description: "공감 능력 결여", genz_text: "근자감 쩔고 타격감 제로. 남들이 팩폭 때려도 상처 안 받는데, 반대로 남 위로해 줄 때도 로봇처럼 굴어서 'F'들한테 욕먹음." },
    "무비겁(無比劫) + 인성다자": { description: "온실 속 마마보이/걸", genz_text: "멘탈 유리쿠크다스. 의존성 강해서 혼자서 결정 못 하고 맨날 주변(특히 엄마)한테 물어봄. 탯줄 끊고 독립하는 게 평생 숙제." },
    "무비겁(無比劫) + 식상다자": { description: "멘탈 약한 인싸", genz_text: "입은 살아있고 오지랖은 태평양인데 정작 내 멘탈은 방어력 0. 남들 다 퍼주다가 나 혼자 남겨지면 외로워서 우울증 옴." },
    "무비겁(無比劫) + 재성다자": { description: "인맥 다이어트 시급", genz_text: "주변에 사람은 많은데 찐친은 없음. 내 돈 보고 꼬이는 똥파리들만 가득함. 사람한테 기대지 말고 내 돈으로 나한테만 투자해." },
    "무비겁(無比劫) + 관성다자": { description: "조직의 노예", genz_text: "남 눈치 보느라 내 자아가 소멸 직전임. '내가 이거 안 하면 큰일 나겠지?' 강박증 달고 삶. 눈치 좀 그만 보고 나대도 됨." }
  },
  // [2] 에너지 쏠림 및 신약 분석 (Energy Imbalances & Vulnerabilities)
  imbalance_analysis: {
    "비겁다자 + 관살혼잡": { description: "내 자존심 vs 세상의 억까", genz_text: "난 존나 강한데 세상이 날 억까함. 굽히기 싫은 자존심과 날 짓누르는 환경 사이에서 매일 내적 전쟁 중. 둥글둥글해질 필요 있음." },
    "식상다자 + 편관": { description: "오지랖의 최후", genz_text: "남 일에 참견하고 총대 메다가 독박 씀. 영웅 행세하려다 과로사하기 딱 좋으니 남 일에 신경 끄고 내 밥그릇이나 챙길 것." },
    "재성다자 + 무인성": { description: "쉴 틈 없는 허슬러", genz_text: "돈 생각하느라 머리에 쥐 남. 재충전 0%, 앞만 보고 달리다가 번아웃 직격타 맞음. 돈도 좋지만 제발 명상이나 멍때리기 좀 해." },
    "인성다자 + 관살혼잡": { description: "생각의 지옥", genz_text: "생각이 꼬리에 꼬리를 물고 우주 팽창급으로 커짐. 상사가 헛기침만 해도 '나 잘리나?' 망상함. 정신건강의학과 VIP 되기 전에 탈주해." },
    "재다신약 (재성>비겁)": { description: "아이디어 뱅크인데 텅장", genz_text: "사업 구상은 스티브 잡스급인데 내 수중에 시드머니가 없음. 내 그릇보다 큰 욕심 부리다 가랑이 찢어지니 강제 저축 필수." },
    "식상다신약": { description: "착한 호구", genz_text: "남 도와주고 입 터느라 내 에너지는 방전 됨. 오지랖 부리다 건강 털리고 멘탈 털림. '거절하기' 연습 안 하면 평생 호구 잡힘." },
    "관다신약": { description: "가오 살리다 골병", genz_text: "체면 때문에 무리한 책임 다 떠안음. 남들 보기에 번듯해 보이려고 무리하다가 속병 듦. 안 되는 건 안 된다고 뻔뻔하게 말해라." },
    "인다관설": { description: "눈치 보다 연애/취업 망함", genz_text: "결정장애 레전드. 생각 너무 많이 하다가 좋은 직장, 좋은 인연 다 떠내려보냄. 재고 따지지 말고 3초 안에 결정하는 연습 해." },
    "무관 + 무재": { description: "속세 로그아웃", genz_text: "자본주의 사회의 이방인. 돈, 명예, 승진 그게 다 뭔데? 자연인으로 살고 싶은 욕구 100%. 속세에 억지로 껴 맞추면 병남." },
    "무식상 + 무재": { description: "노잼 로봇", genz_text: "과정도 없고 결과도 안 바램. 그저 숨 쉬니까 일하는 성실함 원툴. 로봇처럼 재미없게 살지 말고 제발 취미 하나만 만들어라." },
    "인다신약 (인성>비겁)": { description: "엄마 품 탈출 실패", genz_text: "받는 것에 익숙해서 베풀 줄 모름. 남이 다 해주길 바라는 수동적 태도. 독립 안 하면 평생 징징이로 남음." },
    "재관다자 (무비인)": { description: "줏대 없는 풍향계", genz_text: "내 의견 제로. 사회가 시키는 대로, 돈이 부르는 대로 질질 끌려다님. 내 자아 챙기기 프로젝트 시급함." }
  },

  // [3] 극단적 성향 조합 (Extreme Personality Tendencies)
  extreme_tendencies: {
    "비겁다자 + 식상다자": { description: "관종력 우주 돌파", genz_text: "나랑 내 친구들이 짱임. 텐션 주체 못 하고 여기저기 사고 치고 다님. 유튜버나 예능인 안 하면 그 에너지가 범죄로 갈 수도 있음." },
    "식상다자 + 재성다자": { description: "미친 워커홀릭", genz_text: "일 중독 말기. 아이디어 내고 돈 벌어들이는 속도가 공장급. 근데 브레이크가 없어서 건강 갈아 먹으니 정기 검진 필수." },
    "관성다자 + 인성다자": { description: "선비의 꼰대화", genz_text: "도덕책 그 자체인데 나이 들면 꼰대 될 확률 1위. 룰 어기는 사람 보면 속에서 천불 남. MZ세대 이해 못 해서 스트레스받음." },
    "비겁다자 + 인성다자": { description: "나르시시스트", genz_text: "자기애 끝판왕. 세상이 날 중심으로 도는 줄 앎. 팩트 체킹 안 하고 내 망상 속에 갇혀서 '내가 최고야' 정신승리 중." },
    "무관 + 무인": { description: "무데뽀 직진", genz_text: "규칙도 안 지키고 생각도 안 함. 그냥 본능대로 움직이는 야생동물. 브레이크 걸어줄 이성적인 파트너 무조건 구해야 함." },
    "무재 + 무식": { description: "득도한 수도승", genz_text: "돈 버는 법도 모르고 쓸 줄도 모름. 물욕, 식욕, 성욕 제로. 이런 사람이 자본주의 빡센 회사 가면 매일매일이 지옥임." },
    "무식상 + 무비겁": { description: "극한의 외로움", genz_text: "내 맘 알아주는 사람도 없고, 내 맘을 표현할 방법도 모름. 군중 속의 고독을 씹으며 방구석에서 혼자 눈물 훔침. 동호회라도 나가라." },
    "무재 + 무관": { description: "프리터족 최적화", genz_text: "알바해서 먹고살 만큼만 버는 일본 프리터족 바이브. 번듯한 간판이나 큰돈 욕심 없어서 오히려 정신 건강은 제일 좋음." },
    "편관다자 (무식상)": { description: "억압된 분노", genz_text: "참을 인(忍) 세 번이면 살인 난다는 거 보여줌. 스트레스 계속 꾹꾹 참다가 한 번 터지면 뉴스 나옴. 운동으로 열기 무조건 빼라." },
    "상관다자 (무인성)": { description: "입으로 망하는 자", genz_text: "브레이크 없는 독설기. 한 마디 한 마디가 비수라 적을 미친 듯이 양산함. 입조심 안 하면 나중에 주변에 아무도 안 남음." },
    "편재다자 (무관성)": { description: "통제 불능 한량", genz_text: "돈 생기면 일단 플렉스하고 보는 욜로족. 통제하는 사람(관성)이 없어서 버는 족족 유흥으로 탕진함. 통장 뺏어서 엄마 줘라." },
    "정인다자 (무재성)": { description: "현실감각 0", genz_text: "세상은 아름다워~ 꽃밭 마인드. 돈 안 되는 공부나 취미에 빠져 살기 딱 좋음. 현실 감각 일깨워 줄 잔소리꾼 친구 필수." }
  },

  // [4] 고전적 십성 관계 (Traditional Ten Gods Relations)
  traditional_relations: {
    "군겁쟁재(群劫爭財)": { description: "비겁이 모여 재물을 다툼", genz_text: "내 돈 도난 경보! 친구, 동업자랑 돈 엮이는 순간 통장도 털리고 우정도 털림. 술값 쏘기 병 당장 고치고 내 지갑 철벽 수비해." },
    "군비쟁관(群比爭官)": { description: "비겁이 모여 관성을 다툼", genz_text: "피 튀기는 오디션 서바이벌. 취업, 승진, 심지어 연애에서도 꼭 경쟁자가 들러붙음. 삼각관계 조심하고 내 밥그릇 꽉 쥐어." },
    "관살혼잡(官殺混雜)": { description: "정관과 편관이 뒤섞임", genz_text: "이 직장 찔러보고 저 직장 기웃거림. 연애도 나쁜 놈 만났다 착한 놈 만났다 환승 이직의 달인. 하나만 진득하게 파는 게 살길임." },
    "식상혼잡(食傷混雜)": { description: "식신과 상관이 뒤섞임", genz_text: "프로 찍먹러. 재능은 100개인데 끝까지 파는 게 1개도 없음. 말 엄청 많고 변덕 죽끓듯 해서 하나로 좁혀서 '원툴' 파는 게 시급함." },
    "재성혼잡(財星混雜)": { description: "정재와 편재가 뒤섞임", genz_text: "본업 하면서 주식 차트 보고 부업 뛰는 N잡러. 근데 이리저리 돈 다 분산해놔서 정작 손에 쥐는 큰돈은 없음. 똘똘한 한 채에 몰빵해." },
    "인성혼잡(印星混雜)": { description: "정인과 편인이 뒤섞임", genz_text: "망상의 늪에 빠짐. 오만가지 생각 다 하다가 결국 결정장애 옴. 뇌 용량 초과 상태니 제발 생각 끄고 몸부터 움직여!" },
    "합살유관(合殺留官)": { description: "흉한 편관을 묶고 길한 정관을 남김", genz_text: "쓰레기 차 피했더니 벤츠 옴. 나 괴롭히던 억까 상황 기가 막히게 해결되고 번듯한 자리 꿰차는 인생 대역전 서사." },
    "거관유살(去官留殺)": { description: "길한 정관을 묶고 흉한 편관을 남김", genz_text: "대기업 사표 내고 아프리카 봉사활동 가는 꼴. 편하고 좋은 길 냅두고 굳이 빡세고 험난한 길 골라서 고생길 자처하는 사서 고생러." },
    "상관합살(傷官合殺)": { description: "상관과 편관의 타협", genz_text: "적과 딜(Deal)을 치는 협상의 마술사. 말빨과 로비 능력으로 위기를 부드럽게 넘김. 불량배를 달래서 내 보디가드로 쓰는 지략가." },
    "인성용살(印星用殺)": { description: "편관의 시련을 인성으로 승화", genz_text: "위기를 내 커리어로 만듦. 회사에서 아무도 안 하려는 폭탄 업무 맡아서 성공시키고 권력 꿰차는 독기 가득한 승부사." },
    "탐재괴인(貪財壞印)": { description: "재물 탐하다 인성(명예/도덕) 박살", genz_text: "뒷돈 받다가 뉴스 나올 상. 눈앞의 현찰에 눈멀어서 내 평판, 도덕성, 자격증 다 날려 먹음. 뇌물/투기 절대 조심 경고 때려줘." },
    "패인(佩印)": { description: "상관의 날뜀을 인성으로 컨트롤", genz_text: "입 터는 재능(상관)에 국가 공인 자격증(인성)을 장착. 전문가 타이틀 달고 말로 돈 끌어모으는 1타 강사나 스타 변호사 재질." },
    "양인가살(陽刃駕殺)": { description: "양인과 편관의 강력한 시너지", genz_text: "칼 찬 스파르타 장군. 스케일 미쳤고 카리스마로 조직 씹어먹음. 위기 상황에 투입되면 피 철철 흘리며 캐리하는 군검경 에이스." },
    "득비리재(得比理財)": { description: "약한 재성을 비겁의 도움으로 취함", genz_text: "내 능력으론 못 뚫는 판, 크루(인맥) 동원해서 대박 터트림. 나 혼자보단 인플루언서 친구들 등에 업고 돈 버는 네트워킹 천재." },
    "제살태과(制殺太過)": { description: "편관을 식상이 너무 심하게 극함", genz_text: "쥐 잡으려다 초가삼간 다 태움. 쪼잔한 적 하나 잡으려고 대포 쏘는 과잉 방어. 너무 예민하게 날 세우지 말고 힘 좀 빼라." }
  },
  // [1] 특수 격국 및 상황 (Special Situations & Breakage)
  special_breaks: {
    "파료상관(破了傷官)": { description: "상관의 기운이 깨짐", genz_text: "나대다가 윗사람한테 제대로 찍혀서 박살 남. 입 잘못 털어서 밥그릇 걷어차는 형국. 당분간 닥치고 납작 엎드리는 게 살길임." },
    "관살혼잡 + 도화": { description: "이성 문제로 인한 관재수", genz_text: "스캔들 제조기. 복잡 연애사 때문에 직장이나 사회적 평판까지 박살 남. 플러팅 금지하고 사생활 클린하게 유지 필수." },
    "재성다자 + 재생관": { description: "돈 바쳐서 간판 삼", genz_text: "로비의 신. 내 돈 퍼부어서 권력자한테 빌붙거나 승진하는 스타일. 실속은 좀 빠져도 결국 원하는 자리는 꿰차는 정치꾼." },
    "비겁다자 + 쟁재 + 원진": { description: "돈 잃고 사람 잃고 원망함", genz_text: "가장 믿었던 친구한테 보증 서주고 배신당함. 잃어버린 돈 생각하며 밤마다 이불킥하고 저주하는 독기 서사. 보증 절대 금지." },
    "식상생재 + 형살(刑殺)": { description: "의료/법률/조정으로 돈 범", genz_text: "피 보고 고치는 일(수술, 재판, 기계 수리)로 돈 긁어모음. 험악한 꼴 봐야 내 주머니가 두둑해지는 액땜 최적화 전문직." }
  },

  // [2] 십성 + 도화살 조합 (10 Gods + Do-hwa: Popularity/Charm)
  ten_gods_dohwa: {
    "비견 + 도화": { description: "또래/친구 사이의 인기", genz_text: "인싸 중의 핵인싸. 무리에서 은근히 센터 차지함. 동성 친구들이 더 열광하는 '여덕/남덕' 몰이꾼 재질." },
    "겁재 + 도화": { description: "경쟁적인 매력, 빼앗음", genz_text: "치명적인 메기남/녀 등장. 환승 연애나 삼각관계 중심에 서기 딱 좋음. 남의 애인이 나한테 흔들리는 톡식한 상황 주의." },
    "식신 + 도화": { description: "먹방, 취미, 말씨의 매력", genz_text: "먹는 모습만 봐도 플러팅 됨. 귀엽고 사랑스러운 매력으로 우쭈쭈 받음. 요리나 말하는 직업으로 나가면 대박 침." },
    "상관 + 도화": { description: "도발적, 치명적, 언변", genz_text: "걸어 다니는 어그로 자판기. 말 한마디로 사람 홀리고 빡치게 하는 재주가 있음. 틱톡/릴스 스타 안 하면 국가적 손실." },
    "정재 + 도화": { description: "안정적 자산과 매력", genz_text: "통장 잔고가 섹시함. 돈 냄새 풍기는 고급스러운 매력. 나 좋다는 사람 중에 조건 좋고 돈 많은 사람 꼬이는 꿀팔자." },
    "편재 + 도화": { description: "스케일 큰 매력, 유흥", genz_text: "파티 피플의 정석. 돈 펑펑 쓰면서 폼 잡는 거 좋아함. 클럽이나 핫플 가면 무조건 번호 따이는 화려함의 극치." },
    "정관 + 도화": { description: "반듯함 속의 매력, 사내연애", genz_text: "오피스 로맨스 장인. 단정하게 수트 입고 일하는 모습에 치이는 사람 한 트럭. 사내 스캔들 조심하고 공과 사 확실히 해라." },
    "편관 + 도화": { description: "나쁜 남자/여자, 험난한 매력", genz_text: "마라맛 로맨스. 묘하게 위험하고 기 쎈 사람한테만 끌림. 연애사 평탄치 않고 피 튀기지만 그 자극을 즐기는 변태적 성향." },
    "정인 + 도화": { description: "모성애 자극, 우아함", genz_text: "숨만 쉬어도 사람들이 챙겨주고 싶어 하는 댕댕이. 윗사람(교수, 상사)한테 유독 예쁨 받는 프리패스 관상." },
    "편인 + 도화": { description: "신비주의, 4차원 매력", genz_text: "퇴폐미 레전드. 속을 알 수 없는 딥다크한 신비주의에 마니아층이 미친 듯이 감김. 예술가나 아이돌 센터에 찰떡." }
  },

  // [3] 십성 + 역마살 조합 (10 Gods + Yeok-ma: Global/Movement)
  ten_gods_yeokma: {
    "비견 + 역마": { description: "친구와 동행, 독립", genz_text: "친구 따라 강남 가고 해외 감. 크루 맺어서 워홀이나 해외여행 다닐 때 텐션 떡상함. 홀로서기 최적화 멘탈." },
    "겁재 + 역마": { description: "경쟁을 피해/위해 떠남", genz_text: "현실 도피형 유학/이직. 내 밥그릇 뺏기기 싫어서 빡쳐서 짐 싸는 스타일. 근데 낯선 땅 가면 전투력 더 상승함." },
    "식신 + 역마": { description: "맛집 투어, 돌아다니며 즐김", genz_text: "먹기 위해 여행하는 프로 방랑러. 한 자리에 가만히 못 있고 맛집/핫플 도장 깨기 해야 직성 풀림. 먹방 유튜버 재질." },
    "상관 + 역마": { description: "언어 능력, 무역, 반항", genz_text: "한국어보다 외국어 할 때 성격 더 좋아짐. 외국물 먹어야 내 똘끼와 재능이 100% 발휘됨. 무역업이나 외교 쪽에 찰떡." },
    "정재 + 역마": { description: "타지/해외에서 안정적 수입", genz_text: "물 건너가서 월급 받는 팔자. 출장 잦은 직장이나 해외 지사 발령 날 때 통장 잔고 두둑해짐. 돈 벌러 돌아다님." },
    "편재 + 역마": { description: "글로벌 스케일의 사업", genz_text: "스케일 미쳤음. 동네 상권으론 만족 못 하고 무조건 글로벌로 놀아야 함. 해외 주식, 코인, 직구 사업으로 한탕 노리는 허슬러." },
    "정관 + 역마": { description: "이동 잦은 공직/대기업", genz_text: "발령 잦은 대기업이나 외교관, 승무원 최적화. 번듯한 유니폼 입고 전 세계 돌아다니는 간지 폭발 라이프스타일." },
    "편관 + 역마": { description: "험난한 타향살이, 극한 직업", genz_text: "군대 파병이나 해외 극한 오지 발령 잼. 개고생은 예약되어 있는데, 거기서 버티면 훈장 달고 금의환향하는 서사." },
    "정인 + 역마": { description: "유학, 해외 학위", genz_text: "캐리어에 전공 서적 꽉꽉 채워가는 유학파. 타지에서 귀인 만나서 학위 따고 문서운 잡는 기특한 글로벌 엘리트." },
    "편인 + 역마": { description: "철학적 방랑, 워홀", genz_text: "자아 찾으러 인도나 산티아고 순례길 떠나는 방구석 철학자. 낯선 문화 엄청 빨리 흡수하고 특이한 영감 받아옴." }
  },

  // [4] 십성 + 백호/괴강/양인 조합 (10 Gods + Power Stars: Authority/Charisma)
  ten_gods_power: {
    "비견 + 백호": { description: "형제/친구와의 피 튀기는 경쟁", genz_text: "내 친구가 가장 빡센 라이벌. 지는 거 죽기보다 싫어해서 우정보다는 승부욕이 앞섬. 동업하면 피 보니까 절대 혼자 해라." },
    "비견 + 괴강": { description: "독보적인 아우라, 보스 기질", genz_text: "가오 하나로 짱 먹는 보스몹. 누구 밑에 절대 못 들어가고 무조건 무리에서 대장 해야 함. 꺾이지 않는 고집불통." },
    "비견 + 양인": { description: "극단적 자립심, 칼 같은 절단", genz_text: "인간 제설차. 내 앞길 막는 놈은 칼같이 잘라내고 직진함. 자립심 우주 최강이라 남한테 기대는 거 극혐함." },
    "겁재 + 백호": { description: "치명적인 재물 손실/투쟁", genz_text: "투자/도박에서 멘탈 털림. 남의 떡 뺏으려다 내 떡까지 다 날려먹는 야수. 무조건 방어적으로 자산 묶어놔야 삼." },
    "겁재 + 괴강": { description: "적군과의 피 말리는 기싸움", genz_text: "승자독식 서바이벌. 경쟁자랑 머리끄덩이 잡고 싸워서라도 쟁취하는 독기. 멘탈이 방탄유리라 웬만한 어그로는 타격도 없음." },
    "겁재 + 양인": { description: "폭력성, 군검경 최적화", genz_text: "분노 조절 필수. 욱하면 뵈는 게 없어서 사고 칠 수 있음. 이 에너지 격투기나 운동, 군경찰로 안 풀면 뉴스 나옴." },
    "식신 + 백호": { description: "일/건강의 갑작스러운 변화", genz_text: "일 벌이는 스케일이 남다름. 밥 먹다 갑자기 대형 프로젝트 구상함. 근데 무리하다가 갑자기 훅 쓰러질 수 있으니 과로 금지." },
    "식신 + 괴강": { description: "독보적인 전문 기술/요리", genz_text: "셰프의 칼잡이 바이브. 요리나 기계 만지는 솜씨가 압도적임. 내 분야 파고들면 무조건 장인 소리 듣는 능력자." },
    "식신 + 양인": { description: "치열한 연구/전문성", genz_text: "날카로운 도구로 먹고살 팔자. 의사, 치과의사, 엔지니어 등 피 보거나 정밀한 기술 쓰면 돈이 쏟아져 들어옴." },
    "상관 + 백호": { description: "말로 치명상 입힘", genz_text: "말이 곧 흉기. 팩트로 사람 명치 때리다 못해 구멍을 냄. 입조심 안 하면 말 한마디로 내 밥그릇 걷어차니 닥치는 연습 요망." },
    "상관 + 괴강": { description: "기득권 파괴, 혁명가", genz_text: "기존 룰 다 부수는 스타트업 반항아. 상사가 헛소리하면 절대 안 참고 사표 던지는 사이다 액션. 프리랜서가 답임." },
    "상관 + 양인": { description: "카리스마 있는 말빨", genz_text: "말로 사람 홀리고 죽이는 1타 강사. 정치인이나 변호사처럼 토론으로 남 압살하는 직업 가지면 천하무적임." },
    "정재 + 백호": { description: "돈/처와 관련된 극단적 상황", genz_text: "돈벼락 맞거나 쪽박 차거나. 중간이 없음. 투자할 때 하이 리스크 하이 리턴 오지게 쫓다가 멘탈 털리니 안전 자산에 묻어." },
    "정재 + 괴강": { description: "빡센 경제 관념, 구두쇠", genz_text: "돈에 대한 집착이 에베레스트급. 10원 한 장 허투루 안 쓰는 지독한 구두쇠라 결국엔 자수성가로 빌딩 올림." },
    "정재 + 양인": { description: "재물을 쥐락펴락함", genz_text: "돈 냄새 맡으면 칼같이 움직이는 사냥꾼. 돈 벌 땐 피도 눈물도 없이 냉혹해짐. 배우자 꽉 쥐고 사는 스타일." },
    "편재 + 백호": { description: "스펙터클한 사업가", genz_text: "야수의 심장으로 풀매수 때리는 크립토 브로. 스케일이 우주급이라 쪼잔한 월급쟁이 못함. 롤러코스터 수익률 감당해라." },
    "편재 + 괴강": { description: "일확천금, 거물", genz_text: "거물 사업가 재질. 빚을 내서라도 판을 키워야 직성 풀림. 쫄보들은 옆에 가지도 못하는 압도적인 배포의 소유자." },
    "편재 + 양인": { description: "투기, 재물 쟁취", genz_text: "돈 놓고 돈 먹는 타짜. 남의 돈 뺏어오거나 내 돈 지키거나 둘 중 하나. 투자 시장에서 피 튀기는 전투 벌이는 승부사." },
    "정관 + 백호": { description: "압도적 직위, 관재수 주의", genz_text: "완장 차면 눈빛부터 달라짐. 초고속 승진 아님 강제 퇴사. 조직에서 극단적인 파워 게임 휘말리기 쉬우니 줄 잘 서라." },
    "정관 + 괴강": { description: "강인한 리더십, 철권통치", genz_text: "카리스마 쩌는 호랑이 팀장님. 룰 어기면 얄짤없음. 부하 직원들이 무서워하면서도 따를 수밖에 없는 압도적 포스." },
    "정관 + 양인": { description: "권력 쟁취, 경찰/군인", genz_text: "칼 차고 벼슬하는 장군 팔자. 공권력 쥐거나 빡센 권위 가지는 직업 무조건 추천. 안 그러면 평소에 피곤하게 쌈닭 됨." },
    "편관 + 백호": { description: "극난 극복, 영웅 서사", genz_text: "전쟁터의 람보. 인생이 억까의 연속인데 피 철철 흘리면서 결국 다 깨부수는 좀비 멘탈. 고생 끝에 무조건 낙 온다." },
    "편관 + 괴강": { description: "무소불위의 권력", genz_text: "최종 보스 등장. 웬만한 시련은 코웃음 치고 넘김. 남들 멘탈 바사삭될 때 혼자 눈 부라리며 수습하는 찐 하드캐리 유저." },
    "편관 + 양인": { description: "양인가살, 최고의 권위", genz_text: "메스 든 외과의사 or 스파르타 장군. 가장 험악하고 힘든 일에서 최고의 능력을 발휘함. 폼생폼사 난이도 최상급." },
    "정인 + 백호": { description: "모친/학문 관련 극단성", genz_text: "공부에 미친 독기. 한 번 파고들면 코피 쏟을 때까지 책상 안 떠남. 어머니 치맛바람이나 간섭이 좀 빡셀 수 있음." }
  },
  // [1] 인성 + 강력한 신살 (In-seong + Power Stars)
  in_seong_power: {
    "정인 + 괴강": { description: "압도적인 지적 능력", genz_text: "걸어 다니는 백과사전. 남들 논문 쓸 때 혼자 위인전 쓰는 수준의 학문적 스케일. 지식으로 남 짓누르는 지적 카리스마." },
    "정인 + 양인": { description: "칼 같은 판단력 + 문서", genz_text: "도장 찍을 때 피도 눈물도 없음. 부동산이나 계약서 만질 때 절대 손해 안 보는 칼 같은 분석력. 사기꾼들이 제일 무서워함." },
    "편인 + 백호": { description: "극단적 영감, 특이한 기행", genz_text: "신내림 직전의 천재. 촉이 소름 돋게 좋아서 주식 차트나 사람 속마음 귀신같이 맞춤. 스트레스받으면 멘탈 훅 감 주의." },
    "편인 + 괴강": { description: "심오한 학문, 오컬트 마스터", genz_text: "방구석 철학자인데 스케일이 교주급. 남들 안 믿는 미스터리나 마이너 학문 파서 그 바닥의 전설이 됨." },
    "편인 + 양인": { description: "예리한 분석, 의심병", genz_text: "셜록 홈즈 강림. 의심 엄청 많아서 팩트 체크 안 된 거 절대 안 믿음. 날카로운 직관으로 남들 속임수 다 까발리는 해커 재질." }
  },

  // [2] 십성 + 귀문관살 조합 (10 Gods + Gwimun: Obsession/Genius)
  ten_gods_gwimun: {
    "비견 + 귀문": { description: "친구/형제에 대한 집착", genz_text: "절친한테 집착하는 병 있음. '너 왜 나 빼고 놀아?' 섭섭함 버튼 수시로 눌림. 쿨한 척하지만 속으론 친구 카톡 답장 텀 계산함." },
    "겁재 + 귀문": { description: "경쟁자에 대한 과몰입", genz_text: "내 라이벌 인스타 부계정으로 맨날 염탐함. 쟤보단 무조건 잘나가야 한다는 망상적 강박증이 나를 갉아먹으니 현생에 집중해." },
    "식신 + 귀문": { description: "덕질의 끝판왕, 몰입", genz_text: "하나 꽂히면 밤새서 끝장 보는 하이퍼 픽세이션(과몰입) 덕후. 그 에너지로 요리, 예술, 음악 파면 천재 소리 듣고 돈 긁음." },
    "상관 + 귀문": { description: "언어적 천재성, 말꼬리 잡기", genz_text: "말싸움 절대 안 짐. 1년 전 니가 한 말까지 다 기억해서 팩폭으로 때림. 랩 경연 대회 나가면 우승할 천재적인 언어 구사력." },
    "정재 + 귀문": { description: "돈/물건에 대한 심한 집착", genz_text: "가계부 10원 틀리면 잠 못 자는 결벽증. 내 물건 남이 건드리는 거 극혐함. 돈에 꽂히면 영혼까지 팔 기세라 물욕 내려놓기 훈련 요망." },
    "편재 + 귀문": { description: "사차원적 투자, 공간지각", genz_text: "도지코인 떡상 맞추는 묘한 직관력. 남들 다 미쳤다고 하는 곳에 돈 부어서 대박 치거나 쪽박 차거나. 촉 하나는 소름 돋음." },
    "정관 + 귀문": { description: "완벽주의 강박, 명예 집착", genz_text: "결벽증급 FM 모범생. 룰 어기는 사람 보면 속에서 천불이 나서 혼자 끙끙 앓음. 남 시선 엄청 신경 쓰느라 멘탈 바스라지는 중." },
    "편관 + 귀문": { description: "극도의 스트레스, 영적 체험", genz_text: "가위 눌림 주의. 스트레스가 극에 달하면 귀신도 볼 기세로 촉이 곤두섬. 명상이나 요가 안 하면 공황장애 올 수 있으니 멘탈 케어 1순위." },
    "정인 + 귀문": { description: "공부/어머니에 대한 애증", genz_text: "머리 팽팽 돌아가는 천재인데 엄마랑 묶이면 묘하게 숨 막히는 애증 관계 됨. 생각 너무 많아서 불면증 달고 사니까 생각 끄고 자." },
    "편인 + 귀문": { description: "오컬트 천재, 촉의 정점", genz_text: "무당 뺨치는 직관력. 타로, 사주, 심리학 파면 이 구역 1타 강사 됨. 남들 모르는 우주의 비밀을 혼자 다 아는 듯한 신비주의자." }
  },

  // [3] 십성 + 원진살 조합 (10 Gods + Wonjin: Love-Hate/Resentment)
  ten_gods_wonjin: {
    "비견 + 원진": { description: "인간관계 회의감", genz_text: "사람 엄청 좋아하는데 상처도 제일 많이 받음. 줬다 뺐다 하는 관계에 지쳐서 주기적으로 인간관계 다 썰어버리고 동굴 들어감." },
    "겁재 + 원진": { description: "미워하면서 닮아감", genz_text: "저 인간 진짜 극혐하면서 묘하게 신경 쓰이고 질투함. 경쟁자랑 애증의 끈으로 묶여서 서로 피 말리는 혐관 서사 뚝딱." },
    "식신 + 원진": { description: "식탐/취미의 기복", genz_text: "다이어트 강박과 폭식을 오가는 롤러코스터. 뭐 하나 꽂히면 미친 듯이 하다가 갑자기 질려서 쳐다보기도 싫어지는 변덕쟁이." },
    "상관 + 원진": { description: "말로 주고받는 상처", genz_text: "말 예쁘게 하는 법 까먹음? 기분 나쁘면 혀에 독 바르고 상대방 아킬레스건 찌름. 그러고 혼자 미안해서 속앓이하는 츤데레." },
    "정재 + 원진": { description: "내 것에 대한 꽁함", genz_text: "누가 내 볼펜 하나 허락 없이 쓰면 그날 하루 종일 기분 잡침. 쪼잔해 보일까 봐 말은 못 하고 속으로 저주 인형에 바늘 꽂음." },
    "편재 + 원진": { description: "사업/돈에 대한 스트레스", genz_text: "돈 엄청 벌고 싶은데 뜻대로 안 풀려서 홧병 남. 주식 물리면 10년 동안 그 회사 욕하고 다님. 쿨하게 손절하는 법 좀 배워라." },
    "정관 + 원진": { description: "상사/남편과의 애증", genz_text: "회사 부장님(또는 남편) 꼴도 보기 싫은데 또 칭찬받으면 은근히 기분 좋음. 지독한 애증의 직장/결혼 생활 버티기 만렙." },
    "편관 + 원진": { description: "세상에 대한 원망", genz_text: "왜 나한테만 억까야! 세상이 날 억까한다고 생각해서 혼자 방어막 치고 삐딱선 탐. 피해의식 내려놓고 둥글게 사는 법 배워야 함." },
    "정인 + 원진": { description: "사랑받고 싶은 결핍", genz_text: "인정 욕구 몬스터. 나 안 챙겨주면 금방 서운해져서 입 대빨 나옴. 해달라고 말은 안 하면서 알아주길 바라는 피곤한 여우." },
    "편인 + 원진": { description: "꼬아서 듣는 병", genz_text: "상대방은 칭찬했는데 '저거 나 멕이는 건가?' 하고 혼자 뇌피셜 돌려서 상처받음. 제발 텍스트 그대로 받아들이는 연습 좀 해라." }
  },

  // [4] 십성 + 현침살 조합 (10 Gods + Hyeon-chim: Sharpness/Technique)
  ten_gods_hyeonchim: {
    "비견 + 현침": { description: "칼 같은 선 긋기", genz_text: "내 사람 아니면 1초 만에 칼차단. 인간관계 맺고 끊음이 수술실 메스급으로 예리함. 친구가 헛소리하면 바로 팩트로 찔러버림." },
    "겁재 + 현침": { description: "수단 방법 안 가리는 예리함", genz_text: "경쟁자 약점 귀신같이 찾아내서 찌름. 승부를 위해서라면 피 튀기는 냉혹함도 불사하는 전략가. 적당히 해라, 찔린 사람 운다." },
    "식신 + 현침": { description: "디테일 변태, 손재주", genz_text: "마이크로 단위로 쪼개는 디테일 변태. 바늘, 메스, 타블렛 펜 들고 정밀한 작업(의료, 타투, IT) 하면 돈 긁음." },
    "상관 + 현침": { description: "독설의 아이콘", genz_text: "말이 비수 그 자체. 상대방이 제일 아파할 말만 골라서 정밀 타격함. 랩 배틀 나가면 디스전 1등. 제발 그 예리함을 일에만 써." },
    "정재 + 현침": { description: "마이크로 가계부", genz_text: "10원 단위로 엑셀 정리 안 맞으면 잠 못 잠. 이율 0.1% 따져가며 재테크하는 정밀 타격형 짠테크 달인. 세무/회계에 찰떡." },
    "편재 + 현침": { description: "틈새시장 공략", genz_text: "남들 안 보는 블루오션 바늘구멍 찾아내서 돈 빨아먹는 재능. 차트 분석이나 데이터 쪼개는 일 하면 타의 추종을 불허함." },
    "정관 + 현침": { description: "예리한 감시자", genz_text: "규율 어기는 거 칼같이 잡아내는 매의 눈. 감사팀, 법률, 검찰 쪽에 있으면 비리 다 캐내서 조직 엎어버리는 정의의 사도 재질." },
    "편관 + 현침": { description: "찌르고 찔리는 고통", genz_text: "내 몸에 칼 댈 일(수술, 침) 많음. 스트레스받으면 신경성 두통 옴. 활인업(남 살리는 직업)으로 업상대체 안 하면 내가 아픔." },
    "정인 + 현침": { description: "뼈 때리는 조언자", genz_text: "다정하게 팩폭함. '너 잘되라고 하는 소리야' 하면서 예리하게 뼈 때리는 참스승. 글 쓸 때 비평이나 칼럼 쓰면 대박 남." },
    "편인 + 현침": { description: "날카로운 통찰력", genz_text: "인간 거짓말 탐지기. 상대방이 숨기는 거 바늘로 찌르듯 콕 집어냄. 침술, 한의학, 타로 같은 미세한 감각 쓰는 쪽에 타고남." }
  },

  // [5] 십성 + 탕화살 조합 (10 Gods + Tanghwa: Emotional Outburst)
  ten_gods_tanghwa: {
    "비겁 + 탕화": { description: "욱하는 성질", genz_text: "화딱지 버튼 눌리면 눈 돌아감. 친구랑 잘 놀다가 갑자기 급발진해서 다 엎어버림. 감정 스위치 고장 주의, 마인드 컨트롤 필수." },
    "식상 + 탕화": { description: "불타오르는 감정 표현", genz_text: "기분 좋으면 세상 다 가진 듯 오버액션, 빡치면 불바다. 감정 기복이 용광로 수준이라 연기나 예술로 분출 안 하면 속 터져 죽음." },
    "재성 + 탕화": { description: "지름신 강림, 충동구매", genz_text: "스트레스받으면 시발비용으로 카드 한도 초과될 때까지 긁음. 홧김에 투자하고 홧김에 퇴사하는 병 있으니 제발 참을 인 3번 외쳐." },
    "관성 + 탕화": { description: "상사 멱살 잡기 직전", genz_text: "억압받으면 화병 남. 상사나 남편/아내가 잔소리하면 속에서 천불이 나서 들이받기 직전임. 스트레스 풀 취미 무조건 있어야 함." },
    "인성 + 탕화": { description: "생각하다 열받음", genz_text: "과거 기억 혼자 리플레이하면서 '그때 이렇게 말할걸!!' 하고 새벽 3시에 침대 쾅쾅 침. 불필요한 감정 쓰레기 빨리 태워버려라." }
  },

  // [6] 십성 + 공망 조합 (10 Gods + Gong-mang: Emptiness/Void)
  ten_gods_gongmang: {
    "비겁 + 공망": { description: "사람에 대한 허무함", genz_text: "친구 수백 명 있어도 문득 '내 편은 아무도 없다'는 현타 옴. 인맥 다이어트하고 나 혼자 서는 법 배워야 안 외로움." },
    "식상 + 공망": { description: "채워지지 않는 표현욕", genz_text: "아무리 입 털고 예술 혼 불태워도 묘하게 헛헛함. 뭔가 2% 부족한 느낌 때문에 끊임없이 새로운 취미 찾아 헤매는 유목민." },
    "재성 + 공망": { description: "밑 빠진 독에 돈 붓기", genz_text: "버는 것 같은데 텅장 됨. 돈에 집착할수록 연기처럼 빠져나감. 오히려 돈 욕심 비우고 '명예나 정신적 만족' 쫓을 때 재물이 붙음." },
    "관성 + 공망": { description: "간판에 대한 무소유", genz_text: "대기업, 공무원 타이틀? 그거 먹는 건가? 조직에 얽매이는 거 의미 없대로 느낌. 프리랜서나 내 사업 해야 숨통 트이는 영혼." },
    "인성 + 공망": { description: "배움과 모성의 결핍", genz_text: "공부해도 머리에 안 남는 기분. 엄마 품이 그리운데 채워지지 않는 묘한 결핍감. 정신 승리법 마스터하고 스스로 부모가 되어야 함." }
  },

  // [7] 십성 + 천을귀인 조합 (10 Gods + Cheoneul-Gwiin: Divine Buff)
  ten_gods_cheoneul: {
    "비견 + 천을귀인": { description: "짱친이 곧 귀인", genz_text: "주변 친구들이 내 인생 하드캐리 해 줌. 똥 밟을 뻔한 거 친구가 살려주는 럭키 인맥. 베풀면 베푼 만큼 귀인으로 돌아옴." },
    "겁재 + 천을귀인": { description: "경쟁자가 조력자로", genz_text: "어제의 적이 오늘의 깐부 됨. 나랑 경쟁하던 라이벌이 결정적일 때 나를 도와주는 소년 만화급 극적 서사의 주인공." },
    "식신 + 천을귀인": { description: "타고난 먹을 복/건강", genz_text: "평생 굶어 죽을 일 없음. 어딜 가도 맛있는 거 떨어지고, 위기 상황에 기가 막히게 의식주 해결됨. 말년까지 튼튼한 꿀팔자." },
    "상관 + 천을귀인": { description: "입 털어서 구사일생", genz_text: "말실수해서 나락 갈 뻔했는데, 오히려 그게 밈(Meme)이 돼서 떡상함. 언변에 신의 버프가 걸려있어서 위기 대처 능력 우주 1등." },
    "정재 + 천을귀인": { description: "따박따박 귀한 재물", genz_text: "돈 들어오는 파이프라인에 수호신 붙어있음. 소박하게 적금 부었는데 그게 재개발 터지는 식의 안정적이고 귀한 재물운." },
    "편재+천을귀인": { description: "로또급 스케일의 조력", genz_text: "큰돈 만질 때 보이지 않는 손이 작용함. 투자할 때 기가 막힌 정보 얻거나, 돈 많은 스폰서(조력자) 만나서 스케일 확 커짐." },
    "정관+천을귀인": { description: "탄탄대로 승진/명예", genz_text: "낙하산 아니냐는 소리 들을 정도로 승진 하이패스. 좋은 상사/남편 만나서 온실 속 화초처럼 안락하게 지위 유지하는 VIP." },
    "편관+천을귀인": { description: "시련 속의 헬기 구출", genz_text: "전쟁터 한가운데 떨어졌는데 헬기 타고 구호물자 옴. 빡센 환경에서도 나를 구출해 주는 결정적 귀인 등장으로 드라마틱하게 부활함." },
    "정인+천을귀인": { description: "엄마/스승의 완벽 케어", genz_text: "스승님, 엄마 복 미쳤음. 시험운 문서운에 치트키 발동해서 남들 3수 할 거 1방에 붙음. 도장 찍는 일에 하늘의 버프 있음." },
    "편인+천을귀인": { description: "마이너 분야의 대박", genz_text: "아무도 안 하는 이상한 거 팠는데 그게 시대의 트렌드가 돼서 대박 남. 나의 독특한 직관을 알아주는 귀인을 만나 떡상함." }
  },
  // [2] 십성 + 문창/학당귀인 조합 (Ten Gods + Munchang/Hakdang: Genius/Academic)
  ten_gods_munchang: {
    "비겁+문창/학당": { description: "스터디 그룹 천재", genz_text: "친구들이랑 입 털면서 공부할 때 성적 젤 잘 오름. 똑똑한 친구들 무리에 껴서 시너지 폭발하는 하버드 스터디 그룹 재질." },
    "겁재+문창/학당": { description: "경쟁심으로 뇌 풀가동", genz_text: "쟤한테 지기 싫어서 코피 쏟아가며 공부하다 1등 먹음. 승부욕이 곧 지적 에너지로 직결되는 전투형 엘리트." },
    "식신+문창/학당": { description: "연구/강의 천재", genz_text: "내가 아는 거 남한테 가르쳐줄 때 딕션 미쳤음. 교육자나 연구원 하면 지적 섹시함으로 대중들 홀려버리는 1타 강사 팔자." },
    "상관+문창/학당": { description: "미친 창의력, 천재 작가", genz_text: "입 열고 글 쓰면 베스트셀러. 틀에 박힌 공부보단 기발하고 창의적인 아이디어(기획, 작가, 발명)로 승부 보는 아인슈타인." },
    "정재+문창/학당": { description: "꼼꼼한 재무/회계 뇌", genz_text: "숫자 계산에 특화된 두뇌. 엑셀 수식 짜는 거 예술로 함. 돈 관리, 세무, 회계 쪽에 머리 쓰면 1원도 안 틀리고 다 긁어모음." },
    "편재+문창/학당": { description: "돈 흐름 읽는 천재", genz_text: "월스트리트 브로 재질. 복잡한 경제 흐름 싹 다 읽어내고 차트 분석력 미쳤음. 돈 되는 공부만 골라 하는 자본주의 뇌섹남녀." },
    "정관+문창/학당": { description: "행정/고시 천재", genz_text: "엉덩이 무겁고 암기력 쩔어서 행정고시, 로스쿨 딱 맞는 모범생 두뇌. 정석대로 파고들어 국가 공인 엘리트 코스 밟음." },
    "편관+문창/학당": { description: "전략/전술의 마스터", genz_text: "위기 상황 돌파하는 지략가 제갈공명. 남들 다 포기할 때 어려운 문제, 법적 소송 얽힌 거 천재적인 전략으로 다 뚫어냄." },
    "정인+문창/학당": { description: "학자의 길, 문서 대박", genz_text: "교수님 프리패스 상. 평생 책 읽고 공부하는 게 적성. 자격증, 학위증 모으는 게 취미고 그 종이 쪼가리가 다 황금으로 변함." },
    "편인+문창/학당": { description: "천재적 직관, 기획력", genz_text: "데이터 분석? 놉. 감과 촉으로 정답 때려 맞추는 멘사급 통찰력. 심리학, IT, 트렌드 기획 쪽에서 신들린 아이디어 뿜어냄." }
  },

  // [3] 십성 + 월덕/천덕귀인 조합 (Ten Gods + Woldeok/Cheondeok: Divine Protection)
  ten_gods_woldeok: {
    "비겁+월덕/천덕": { description: "인간관계 트러블 제로", genz_text: "친구 사이 갈등 생겨도 스무스하게 화해함. 주변에서 나를 '법 없이도 살 천사'로 포장해 줘서 인간관계 인프라 개꿀 빠는 중." },
    "식상+월덕/천덕": { description: "말실수 방어권", genz_text: "입방정 떨어도 사람들이 '그래 그럴 수 있지~' 하고 넘어감. 위기 순간에 내 애교와 언변이 만사형통의 방패가 됨." },
    "재성+월덕/천덕": { description: "돈벼락, 투자 손실 방어", genz_text: "물렸던 주식이 기적처럼 상폐 피하고 본전 치기함. 재물 관련 악재가 닥쳐도 하늘이 도와서 최소한의 타격만 입는 축복." },
    "관성+월덕/천덕": { description: "직장/관재수 면제권", genz_text: "짤릴 위기, 법적 분쟁 뜰 위기에서 천운으로 살아남. 승진 심사 때 나 밀어주는 보이지 않는 손 덕에 꿀벌처럼 승승장구함." },
    "인성+월덕/천덕": { description: "계약/문서의 기적", genz_text: "집 계약 사기당할 뻔했는데 기적적으로 피함. 부모님이나 윗사람이 방패막이 되어줘서 큰 풍파 없이 온실 속에서 곱게 자람." }
  },

  // [4] 십성 + 암록/금여록 조합 (Ten Gods + Amrok/Geumyeo: Hidden Wealth/Luxury)
  ten_gods_amrok: {
    "비겁+암록/금여": { description: "숨은 인맥 떡상", genz_text: "나도 모르는 숨은 빽이 있음. 친구나 지인 중에 은근히 알부자나 능력자 있어서 나 힘들 때 뒤에서 수표 찔러주는 금수저 친구 둔 격." },
    "식상+암록/금여": { description: "취미가 돈 복사기 됨", genz_text: "그냥 재미로 유튜브 올렸는데 떡상해서 현찰 박치기함. 내가 뱉은 아이디어가 황금 알 낳는 거위가 되는 마법의 요술 지팡이." },
    "재성+암록/금여": { description: "비상금, 은밀한 상속", genz_text: "남편/아내 몰래 꿍쳐둔 주식이 10배 오름. 혹은 조상님이 남겨둔 땅이 개발되는 식으로 남몰래 돈방석 앉는 진짜배기 부자 팔자." },
    "관성+암록/금여": { description: "황금 마차 타는 직장/남편", genz_text: "금으로 만든 마차 타는 팔자. 남들 부러워하는 신의 직장 들어가거나, 돈 엄청 많은 배우자 만나서 셔터맨/사모님 라이프 가능." },
    "인성+암록/금여": { description: "저작권, 숨은 문서 대박", genz_text: "책 인세, 음원 저작권, 혹은 옛날에 사둔 땅문서가 자고 일어나니 황금으로 변함. 가만히 앉아서 숨만 쉬어도 돈 들어오는 패시브 인컴." }
  },

  // [5] 십성 + 태극/복성귀인 조합 (Ten Gods + Taegeuk/Bokseong: Perseverance/Luck)
  ten_gods_taegeuk: {
    "비겁+태극/복성": { description: "자수성가의 끝판왕", genz_text: "초년 개고생 다 이겨내고 결국 내 힘으로 탑 찍음. 뚝심 하나로 버텨서 늦게라도 무조건 크게 성공하는 대기만성 1티어." },
    "식상+태극/복성": { description: "평생 마르지 않는 식복", genz_text: "어딜 가도 굶어 죽을 일 없음. 내가 하는 일마다 결국엔 풍요로운 결실 맺음. 말년까지 건강하게 먹고 즐기는 극강의 가성비 복." },
    "재성+태극/복성": { description: "끝내 쥐어지는 큰 부", genz_text: "사업 여러 번 말아먹어도 결국 마지막 한 방으로 빌딩 세움. 포기만 안 하면 하늘이 알아서 큰 재물을 안겨주는 재물 로또." },
    "관성+태극/복성": { description: "늦깎이 명예, 칭송", genz_text: "나이 50 넘어 늦깎이로 정치, 임원, 교수 달고 동네방네 이름 떨침. 초반에 안 풀려도 결국 권력의 정점을 찍는 명예 끝판왕." },
    "인성+태극/복성": { description: "학문/학위의 대성", genz_text: "평생 공부해서 결국 그 바닥 최고의 권위자 됨. 남들 다 인정하는 자격증이나 명예로운 타이틀 얻어 평생 존경받으며 안락하게 삼." }
  },

  // [6] 마스터피스 복합 조합 (Masterpiece Complex Combinations)
  master_combos: {
    "관인상생+천을귀인": { description: "초특급 엘리트 하이패스", genz_text: "드라마 남녀 주인공 세팅 완료. 윗사람이 알아서 끌어주고 명예+문서+귀인 쓰리콤보 터져서 고생 1도 없이 임원 달고 승승장구." },
    "식상생재+문창귀인": { description: "똑똑한 사이드 허슬", genz_text: "머리 써서 돈 버는 N잡 천재. 내 지식(문창)을 입으로 털어서(식상) 현찰(재성)로 만드는 현대 자본주의에 최적화된 마스터마인드." },
    "살인상생+월덕귀인": { description: "구사일생 멘탈 갑", genz_text: "전쟁터에서 적군 총알 피하고 훈장 받는 서사. 빡센 환경(편관)에서 고통받아도 하늘(월덕)이 도와 결국 승리자로 인정(인성)받음." },
    "재관쌍미+금여록": { description: "셔터맨/사모님 + 능력", genz_text: "돈(재성)과 명예(관성) 다 쥐었는데 황금 마차(금여)까지 탔음. 능력도 쩔고 배우자 복도 쩔어서 인생 자체가 로판 웹소설 주인공." },
    "재극인+암록": { description: "천재적 자산 은닉", genz_text: "현실 감각 200%. 겉으론 선비인 척하지만 뒤로는 은밀하게 비자금(암록) 굴려서 알부자 됨. 자본주의 생태계 완벽 적응자." }
  },

  // [7] 지지 위치별 인터랙션 (Pillar Interactions: Year/Month/Day/Hour)
  branch_interactions: {
    "연지(年支) 충(沖)": { description: "고향, 조상, 초년 환경의 리셋", genz_text: "본가 탈출, 독립각! 부모님 그늘 벗어나서 내 살길 찾아 떠나는 해. 억지로 집에 붙어있으면 싸움만 나니까 유학/독립/자취 질러버려." },
    "연지(年支) 합(合)": { description: "가문, 윗사람과의 결합", genz_text: "조상님 버프 발동. 집안에서 유산/증여 얘기 나오거나, 나이 차이 엄청 나는 대왕 꼰대(근데 능력자)가 날 끌어주는 해." },
    "연지(年支) 원진": { description: "윗어른/집안과의 애증", genz_text: "명절에 본가 가면 무조건 싸움 남. 부모님이나 할머니/할아버지랑 오지게 기싸움하는 해. 적당히 거리 두는 게 멘탈에 좋음." },
    "월지(月支) 충(沖)": { description: "직장, 사회적 환경의 파괴/이동", genz_text: "퇴사/이직 마려운 해. 상사 꼴 보기 싫어서 사표 던질 확률 99%. 홧김에 백수 되지 말고 무조건 환승 이직처 구해놓고 책상 엎어라." },
    "월지(月支) 합(合)": { description: "사회적 결합, 정규직 전환", genz_text: "취뽀, 이직 프리패스! 회사에서 내 능력 알아보고 연봉 협상 유리하게 끌고 감. 직장에서 꿀 빠는 안정적인 갓생 구간." },
    "월지(月支) 원진": { description: "직장 내 인간관계 스트레스", genz_text: "오피스 빌런 등장. 부서 내에 나를 은근히 괴롭히는 킹받는 인간 생김. 퇴사하긴 아깝고 다니자니 빡치는 혐관 직장 라이프." },
    "일지(日支) 충(沖)": { description: "배우자 궁, 내 멘탈의 붕괴", genz_text: "연애 전선 비상! 애인이랑 맨날 싸우거나 권태기 씨게 옴. 멘탈 바사삭 돼서 방 빼고 이사할 일 생길 수 있으니 멘탈 꽉 잡아." },
    "일지(日支) 합(合)": { description: "연애운, 결혼운, 안정", genz_text: "솔로 탈출각! 내 일상에 스윽 스며드는 찐인연 등장. 커플은 '우리 결혼할까?' 얘기 나오는 달달하고 안정적인 로맨스 타이밍." },
    "일지(日支) 원진": { description: "애인/배우자와의 권태기/집착", genz_text: "사랑과 전쟁 찍는 해. 애인 폰 몰래 훔쳐보고 혼자 망상함. 헤어지지도 못하고 지독하게 집착하는 톡식 로맨스 조심." },
    "시지(時支) 충(沖)": { description: "아랫사람, 자식, 비밀 프로젝트 파탄", genz_text: "내 부하직원이 하극상 일으키거나, 남몰래 굴리던 코인/사이드 프로젝트 떡락할 위기. 입조심하고 아랫사람 단속 철저히 해." },
    "시지(時支) 합(合)": { description: "부업 성공, 임신, 말년운 상승", genz_text: "퇴근 후 투잡 뛴 거 대박 남! 숨겨둔 내 취미나 투자처에서 짭짤하게 수익 터지는 꿀단지. 혹은 자식/조카 자랑할 일 생김." },
    "시지(時支) 원진": { description: "투자/부하직원으로 인한 속앓이", genz_text: "내가 키운 후배가 내 뒤통수 침. 아니면 남몰래 한 투자 물려서 밤마다 호가창 보며 이불킥함. 올해는 은밀한 짓 절대 금지." }
  },

  // [8] 복합 인터랙션 및 특수 세운 (Complex Transit Interactions)
  complex_transits: {
    "일지 충 + 월지 충": { description: "인생 포맷 버튼 눌림", genz_text: "인생 포맷 버튼 눌림. 직장 짤리고 애인이랑 헤어지는 등 멘탈 붕괴. 근데 이거 '더 좋은 곳으로 가라'는 우주의 큰 그림이니 털고 일어나." },
    "월지 합 + 일지 합": { description: "직장 안정 + 로맨스 성공", genz_text: "완벽한 밸런스. 회사에서 승진하고, 집에 오면 사랑꾼 파트너가 반겨주는 로판 재질의 해. 올해는 행복 회로 풀가동해도 됨." },
    "월지 충 + 세운 관성": { description: "이직운 (스카웃)", genz_text: "명분 있는 퇴사. 그냥 도망치는 게 아니라, 더 좋은 직급과 연봉 달고 다른 회사로 점프 뛰는 스펙터클한 커리어 업그레이드." },
    "일지 충 + 세운 재성/관성": { title: "연애 파탄 후 새로운 만남", genz_text: "헌 차 가고 벤츠 옴. 기존 연애 박살 나고 멘탈 털린 자리에, 조건 훨씬 좋은 새로운 뉴페이스가 들어오는 환승 연애 최적화." },
    "월지 충 + 식상운": { title: "내 사업한다고 퇴사", genz_text: "상사 잔소리에 빡쳐서 '내가 사장 한다!' 하고 뛰쳐나감. 근데 올해는 실행력 폼 미쳤으니까 철저히 기획했으면 질러봐도 됨." },
    "시지 합 + 식상운": { title: "취미가 돈이 됨", genz_text: "방구석 취미로 시작한 블로그/유튜브가 떡상해서 부수입 달달해짐. 퇴근 후 시간 갈아 넣어서 나만의 N잡 파이프라인 완성." },
    "일지 파(破) / 해(害)": { title: "사소한 다툼, 삐걱거림", genz_text: "이혼/이별까진 아닌데 묘하게 핀트 안 맞고 짜증 남. 별것도 아닌 걸로 '너 쿨톤병 걸렸어?' 하면서 치고받는 신경전." },
    "월지 파(破) / 해(害)": { title: "직장 내 파벌 싸움", genz_text: "점심시간에 누구랑 밥 먹을지 눈치 게임 해야 함. 사내 정치질, 파벌 싸움에 휘말려서 내 에너지만 뺏기니 이어폰 꽂고 내 일만 해." },
    "연지 충 + 식상운": { title: "유학, 해외 취업", genz_text: "물 건너갈 타이밍. 국내 좁은 물에서 답답해하지 말고 비행기 티켓 끊어라. 해외나 타지로 뻗어나갈 때 포텐 제대로 터짐." },
    "월지 합 + 인성운": { title: "자격증, 승진 시험 패스", genz_text: "공부 머리 풀가동. 직장에서 필요한 자격증 따거나 승진 시험 볼 때 하늘이 나서서 100점 맞춰주는 엘리트 버프." },
    "일지 원진 + 비겁운": { title: "친구 같은 애인과 혐관", genz_text: "친구인지 애인인지 헷갈림. 편해서 선 넘다가 서로 상처 주고받는 시기. 팩폭 그만하고 예쁜 말 쓰기 챌린지 100일 요망." },
    "시지 충 + 재성운": { title: "묻지마 투자의 최후", genz_text: "지인 카더라 믿고 투자했다가 시드머니 반토막 남. 올해는 남 몰래 돈 굴리는 거 절대 금지, 무조건 1금융권 안전 자산에 묶어." },
    "일/월지 동시 합": { title: "결혼+내집마련 동시 달성", genz_text: "인생 진도 빼는 쾌속 구간. 결혼 날짜 잡고 신혼집 대출까지 한 번에 스무스하게 뚫리는 기적. 바쁘지만 제일 행복한 해." },
    "월지 충 + 인성운": { title: "휴식, 안식년, 재충전", genz_text: "번아웃 와서 회사 때려치우고 쉬는 타이밍. 백수 됐다고 불안해하지 말고 책 읽고 명상하며 멘탈 수리하는 AS 기간으로 써라." },
    "연지 합 + 비겁운": { title: "고향 친구, 동창과의 재회", genz_text: "명절이나 동창회 갔다가 뜻밖의 귀인(또는 인연) 만남. 잊고 지냈던 옛날 사람들과 크루 맺어서 으쌰으쌰 할 일 생김." },
    "시지 합 + 관성운": { title: "자식의 성공, 말년의 감투", genz_text: "자식/조카가 명문대 가거나 취업해서 어깨 으쓱해짐. 나이 든 유저는 동네 감투(반장/회장) 써서 권력 쥐고 폼 잡는 해." },
    "월지 원진 + 겁재운": { title: "동료와의 치명적 기싸움", genz_text: "내 밥그릇 노리는 라이벌 등장. 속으로 천불 나는데 겉으론 웃어야 하는 K-직장인 생존기. 포커페이스 유지 못 하면 털림." },
    "일지 충 + 비겁운": { title: "친구와 연인 사이의 혼란", genz_text: "애인이랑 싸우고 친구한테 위로받다 눈맞음 주의. 혹은 내 애인과 내 친구 사이에서 오해 생겨서 삼각관계 드라마 찍을 수 있음." }
  },
  // [2] 형/파/해 상세 (Detailed Hyeong/Pa/Hae)
  hyeong_pa_hae: {
    "인사신(寅巳申) 삼형": { title: "무은지형: 배신, 권력, 의료, 관재수", genz_text: "메스 들 시간. 내 살 깎아 먹던 관계나 일 강제로 도려내야 함. 법적 분쟁, 뒤통수 주의! 피 보는 직업(의료/IT/타투)이면 오히려 대박." },
    "축술미(丑戌未) 삼형": { title: "지세지형: 세력 다툼, 부동산 분쟁", genz_text: "서열 정리 폼 미쳤음. 서로 자존심 걸고 '누가 더 쎄냐' 기싸움하다가 피 터지는 권력 투쟁. 유산 문제나 부동산으로 멱살 잡을 수 있으니 계약서/문서 검토 100번 해." },
    "자묘(子卯) 형": { title: "무례지형: 무례함, 성적/인간관계 구설", genz_text: "선 넘는 플러팅 주의. 친하다고 막말하다가 사회적 매장당함. 은밀한 스캔들이나 사생활 문제 터질 수 있으니 밤문화/입조심 필수." },
    "진진(辰辰) 자형": { title: "완벽주의, 고집, 자기 학대", genz_text: "셀프 가스라이팅 멈춰! 스스로 무덤 파고 들어가서 '난 안 돼' 하고 자책하는 중. 본인 기준 너무 높으니까 기준치 30%만 낮춰라." },
    "오오(午午) 자형": { title: "폭발적 감정, 분노 조절 장애", genz_text: "급발진 폭주 기관차. 홧김에 다 엎어버리고 다음 날 땅 치고 후회함. 감정 스위치 고장 났으니 화날 땐 무조건 심호흡 3번 하고 입 닫기." },
    "유유(酉酉) 자형": { title: "극도의 예민함, 날카로움", genz_text: "현미경 들이댄 결벽증. 남들 1도 신경 안 쓰는 디테일에 꽂혀서 주변 사람 피 말려 죽임. 그 예민함 뷰티나 디자인 쪽에 써야 병 안 남." },
    "해해(亥亥) 자형": { title: "우울, 번뇌, 생각의 늪", genz_text: "방구석 딥다크 몽상가. 생각이 꼬리에 꼬리를 물고 지하 암반수까지 내려감. 혼자 고립되지 말고 당장 햇빛 보고 광합성 하러 나가라." },
    "자유(子酉) 파": { title: "술, 이성, 은밀한 약속 파기", genz_text: "믿었던 약속 통수 맞음. 특히 술자리나 밤에 한 약속 절대 믿지 마. 유흥 즐기다 흑역사 박제될 수 있으니 일찍 귀가 요망." },
    "축진(丑辰) 파": { title: "부동산, 문서, 금전 손실", genz_text: "계약 파기 주의보. 다 된 밥에 재 빠짐. 특히 집 계약이나 중고 거래할 때 꼼꼼하게 안 보면 사기꾼한테 눈 뜨고 코 베임." },
    "인해(寅亥) 파": { title: "문서, 학업, 계획의 수정", genz_text: "야심 차게 세운 신년 계획 작심삼일 됨. 혹은 믿었던 정보가 가짜 뉴스로 판명 남. 계획 틀어져도 유연하게 플랜 B 가동하는 게 살길." },
    "묘오(卯午) 파": { title: "색정, 구설수, 감정 대립", genz_text: "남의 연애사 오지랖 부리다 내가 욕먹음. 사소한 말실수가 눈덩이처럼 커져서 왕따당할 수 있으니 남 뒷담화하는 단톡방 당장 나와." },
    "사신(巳申) 파": { title: "초반엔 좋다가 나중에 깨짐", genz_text: "용두사미 레전드. 시작할 땐 영혼의 파트너인 줄 알았는데 끝날 땐 원수 됨. 동업이나 공동 프로젝트 할 때 계약서 확실하게 써놔." },
    "술미(戌未) 파": { title: "아랫사람, 내부의 배신", genz_text: "내가 키운 개한테 물리는 격. 후배나 믿었던 부하직원이 내 아이디어 가로채거나 통수 칠 수 있음. 내부 보안 철저히 신경 써라." },
    "자미(子未) 해": { title: "뼈저린 원망, 가족 불화", genz_text: "내 맘 몰라준다고 세상 제일 억울해함. 특히 가족(부모/형제)이랑 엮이면 서로 상처 주기 바쁨. 당분간 쿨하게 각자 인생 살자." },
    "축오(丑午) 해": { title: "폭발, 억울함, 화병", genz_text: "고구마 100개 먹은 답답함. 내 억울함 풀려다 오히려 내가 나쁜 놈 됨. 화병 나서 쓰러지기 전에 운동이나 덕질로 스트레스 쫙 빼." },
    "인사(寅巳) 해": { title: "교통, 사고, 배신", genz_text: "운전 조심, 길조심, 사람 조심! 믿었던 사람한테 발등 찍히고 멘탈 바사삭 됨. 무리한 장거리 이동이나 위험한 익스트림 스포츠 금지." },
    "묘진(卯辰) 해": { title: "주변의 참견, 방해", genz_text: "시어머니 10명 붙은 기분. 내 인생인데 주변에서 '이래라저래라' 훈수 엄청나게 둠. 남들 참견 싹 다 무시하고 '내 알 빠 냐' 마인드 장착." },
    "신해(申亥) 해": { title: "얼굴에 철판 깔기 실패, 상처", genz_text: "쿨한 척 실패! 남들 말에 겉으론 웃어넘기는데 속으론 피 철철 흘림. 얼굴에 철판 깔고 뻔뻔해지는 연습 안 하면 내 멘탈만 녹아내림." },
    "유술(酉戌) 해": { title: "건강, 수술, 날카로운 충돌", genz_text: "건강검진 필수. 스트레스가 뼈나 호흡기 쪽 질환으로 올 수 있음. 말다툼하면 서로 아킬레스건 썰어버리니까 무조건 피하는 게 상책." },
    "세운 삼형살 진입": { title: "인생의 수술대 위", genz_text: "올해는 까불면 죽음. 법, 경찰, 세금 관련된 꼼수 절대 금지. 정직하게 살면 오히려 내가 남들 심판하는 권력자가 되는 '권력의 해'." }
  },

  // [3] 대표 십성 격국 (Core Ten Gods Gyeok-guk)
  core_gyeokguk: {
    "건록격": { title: "독립, 갓생, 자립심", genz_text: "내돈내산 갓생러. 남한테 손 벌리는 거 극혐함. 흙수저로 태어나도 악으로 깡으로 버텨서 결국 내 집 마련하는 자수성가 1티어." },
    "양인/월겁격": { title: "경쟁, 승부사, 독고다이", genz_text: "인간 불도저. 피 튀기는 경쟁 사회에 던져놔야 오히려 도파민 터짐. 남들 멘탈 털릴 때 눈 부라리며 1등 쟁취하는 전투 민족." },
    "식신격": { title: "장인정신, 미식, 여유", genz_text: "프로 워라밸러. 밥상 엎어지는 꼴 절대 못 봄. 내 취향(덕질, 맛집) 확고하고 평생 굶을 일 없이 느긋하게 꿀 빠는 팔자." },
    "상관격": { title: "언변, 팩폭, 스타트업", genz_text: "입으로 사람 뼈 때리는 아가리 파이터. 꼰대 문화 숨 막혀서 무조건 프리랜서나 내 사업 해야 함. 트렌드 젤 빨리 읽는 얼리어답터." },
    "정재격": { title: "안정추구, FM, 가성비", genz_text: "인간 엑셀표. 가성비에 미쳐서 10원 단위로 더치페이함. 일확천금 안 믿고 따박따박 월급 모아서 노후 준비 끝내는 안정 추구형." },
    "편재격": { title: "스케일, 영끌, 사업가", genz_text: "야수의 심장. 인생은 한 방! 스케일 크게 놀다가 한강 뷰 갈지 한강 물 갈지 모르는 롤러코스터. 사업병 도지면 아무도 못 말림." },
    "정관격": { title: "명예, 체면, 유교보이/걸", genz_text: "K-유교보이/걸. 남들 시선 엄청 신경 써서 번듯한 직장(대기업/공무원) 꼭 가야 함. 룰 어기는 거 혐오하는 FM 모범생." },
    "편관격": { title: " 해결사, 폼생폼사, 빡센 환경", genz_text: "인생 난이도 헬모드. 근데 그걸 또 간지로 승화시킴. 남들 다 망했다는 폭탄 업무 들어가서 하드캐리하는 폼생폼사 트러블 슈터." },
    "정인격": { title: "사랑받음, 징징이, 학자", genz_text: "온실 속 화초. 가만히 숨만 쉬어도 사람들이 우쭈쭈 다 챙겨줌. 멘탈 약해서 힘들면 주변에 징징대는데 그게 밉지 않은 게 능력." },
    "편인격": { title: "오타쿠, 예술가, 영감", genz_text: "4차원 뇌구조. 대중적인 건 죽어도 싫은 힙스터 재질. 마이너한 예술, 타로, IT 파고들어서 그 구역 장인 되는 독특한 천재." }
  },

  // [4] 귀격 - 부귀영화 (Auspicious Patterns - Wealth & Honor)
  auspicious_patterns: {
    "록마동향 (祿馬同鄕)": { title: "돈과 명예를 동시에 쥠", genz_text: "돈(재성)이랑 가오(관성) 한 방에 싹쓸이. 취업하면 연봉킹, 결혼하면 돈+외모 다 되는 배우자 낚아채는 로판 주인공 팔자." },
    "식신생재 (食神生財)": { title: "재능을 현금화함", genz_text: "내 덕질이 돈이 되는 매직. 유튜브, 블로그, 부업 시작하면 입소문 타고 현금으로 직행함. 타고난 자본주의 최적화 N잡러." },
    "상관생재 (傷官生財)": { title: "어그로 끌어 돈 버는 기질", genz_text: "입 털어서 돈 버는 재능 미쳤음. 영업, 마케팅, 방송 쪽으로 가면 내 독설과 매력이 전부 돈으로 환전되는 기적을 맛봄." },
    "살인상생 (殺印相生)": { title: "개고생 끝에 훈장", genz_text: "눈물 없인 볼 수 없는 인간 극장. 억까 당하며 멘탈 갈리다가 결국 윗사람한테 픽업돼서 초고속 승진하는 존버 승리 서사." },
    "관인상생 (官印相生)": { title: "프리패스 낙하산", genz_text: "면접 프리패스 상. 직장이나 학교에서 윗사람이 날 알아서 밀어주고 끌어줌. 시험/승진/결혼 모두 스무스하게 뚫리는 엘리트." },
    "식신제살 (食神制殺)": { category: "귀격 (부귀영화)", keywords: "위기를 내 능력으로 깸", genz_text: "폭탄 제거반 1티어. 위기 상황 터지면 쫄지 않고 내 실력으로 문제 다 씹어먹음. 빡센 환경일수록 내 몸값이 천정부지로 뜀." },
    "상관견관 (傷官見官)": { category: "파격 (조심해야 할 구조)", keywords: "조직 들이받기, 퇴사병", genz_text: "입방정 주의보. 꼰대 상사 보면 못 참고 사이다 날려버림. 속은 시원한데 내 밥그릇도 같이 날아가니 제발 참을 인(忍) 3번 새겨라." },
    "재극인 (財剋印)": { category: "파격 (조심해야 할 구조)", keywords: "돈 vs 양심의 딜레마", genz_text: "눈앞에 돈다발 떨어지면 도덕책 던져버릴 수 있음. 잔머리 굴려서 쉽게 돈 벌려다 사기꾼한테 당하거나 명예 날아가니 꼼수 금지." },
    "군겁쟁재 (群劫爭財)": { category: "파격 (조심해야 할 구조)", keywords: "호구 탈출 시급", genz_text: "내 통장은 공공재. 주변에 사람은 엄청 꼬이는데 다 내 돈 빼먹으려는 똥파리들임. 보증, 돈거래, 동업 절대 금지! 폰 꺼놔라." },
    "인다관설 (印多官洩)": { category: "파격 (조심해야 할 구조)", keywords: "생각하다 기회 날림", genz_text: "결정장애 말기 환자. 생각만 100만 번 하다가 좋은 직장, 좋은 애인 다 떠내려보냄. 눈치 그만 보고 일단 지르고 수습해." }
  },
  // [2] 특수 쏠림 및 오행 편중 (Extreme Leaning & Specific Elements)
  extreme_leaning: {
    "종재격 (從財格)": { title: "돈에 영혼을 갉아 넣음", genz_text: "자본주의 몬스터. 인생의 1순위도, 2순위도 무조건 돈. 스케일 미치게 크게 놀아서 재벌 되거나 파산하거나 극단적 롤러코스터." },
    "종살격 (從殺格)": { title: "권력에 순응, 라인 타기", genz_text: "권력의 냄새를 귀신같이 맡음. 줄 타기 만렙이라 가장 쎈 놈 밑에 들어가서 호가호위하며 나도 같이 떡상하는 정치 천재." },
    "종아격 (從兒格)": { title: "내 쪼대로 산다", genz_text: "자유로운 영혼 끝판왕. 남 시선 1도 안 보고 내 취향대로 입고 말하고 행동함. 예술가나 프리랜서 안 하면 숨 막혀 죽음." },
    "종강/종왕격": { title: "우주 돌파 고집", genz_text: "내 말이 곧 법. 세상천지 아무도 내 고집 못 꺾음. 마이웨이로 밀고 나가서 1짱 먹거나 나 혼자 고립되거나 모 아니면 도." },
    "종혁격 (金 몰빵)": { title: "인간 커터칼, 의리", genz_text: "온몸이 쇳덩이로 된 마피아 보스. 의리에 살고 의리에 죽음. 맺고 끊음이 레이저 칼날 같아서 한번 배신한 놈은 두 번 다시 안 봄." },
    "윤하격 (水 몰빵)": { title: "심연의 지혜, 속 모름", genz_text: "끝이 안 보이는 마리아나 해구. 머리 엄청 좋고 철학적인데 음흉(?)할 정도로 속을 안 보여줌. 스케일 큰 지략가 재질." },
    "염상격 (火 몰빵)": { title: "핵인싸, 불기둥", genz_text: "걸어 다니는 활화산. 텐션 주체 못 하고 여기저기 다 들쑤시고 다님. 추진력 하나는 1등인데 금방 식어버리는 게 흠." },
    "곡직격 (木 몰빵)": { title: "무한 성장 잭과 콩나무", genz_text: "쭉쭉 뻗어 나가는 야망러. 위로 올라가려는 욕구 엄청 쎄서 멈추질 못함. 시작은 기가 막히게 잘하는데 마무리가 살짝 약함." },
    "가색격 (土 몰빵)": { title: "인간 스펀지, 포커페이스", genz_text: "타격감 제로의 바위산. 웬만한 일에는 눈 하나 안 깜짝함. 무던하고 신뢰감 쩔어서 주변 사람들이 다 의지하는 듬직한 보스." }
  },

  // [3] 오행 시너지 및 불균형 (Elemental Synergy & Imbalance)
  elemental_synergy: {
    "금수쌍청 (金水雙淸)": { title: "뇌섹남녀, 결벽증", genz_text: "차갑고 맑은 얼음물. 똑똑하고 이성적인데 결벽증 기질 다분함. 미학적인 완벽함을 추구해서 촌스럽고 멍청한 거 제일 극혐함." },
    "목화통명 (木화通明)": { title: "말빨 천재, 아이디어 뱅크", genz_text: "아이디어 화수분. 말 엄청 잘하고 글도 잘 씀. 머릿속에 있는 걸 밖으로 꺼내는 재능이 미쳐서 방송, 마케팅, 교육 쪽에 찰떡." },
    "수목청기 (水木淸奇)": { title: "청초한 학자, 도덕책", genz_text: "아침 이슬 머금은 난초. 청순하고 지적이며 선비 같은 꼿꼿함이 있음. 학문이나 연구 쪽으로 파고들면 명예 떡상함." },
    "화토중탁 (火土重濁)": { title: "속 꽉 막힌 고구마", genz_text: "사이다 10병 필요. 흙이랑 불만 뭉쳐 있어서 엄청 조열하고 고집불통임. 융통성 0이라 남들 속 터지게 하니 제발 남의 말 좀 들어." },
    "토금육수 (土金毓秀)": { title: "장인정신, 융통성 제로", genz_text: "바위 깎는 장인. 한 우물 파는 뚝심은 우주 최강인데, 유연함이 없어서 새로운 트렌드 흡수 속도가 느림. 똥고집 주의." },
    "수다목부 (水多木浮)": { title: "귀 얇음, 휩쓸림", genz_text: "물난리에 떠내려가는 나무. 귀 얇아서 남의 말에 팔랑귀 됨. 줏대 없이 이리저리 휩쓸리니 나만의 확고한 중심 잡기 필수." },
    "목다화식 (木多火息)": { title: "오지랖퍼, 질식 주의", genz_text: "장작이 너무 많아 불이 꺼짐. 챙겨줄 사람(오지랖)이 너무 많아서 정작 내가 번아웃 옴. 이것저것 다 퍼주다 내 명에 못 살아." },
    "화다토조 (火多土燥)": { title: "조급증 말기, 번아웃", genz_text: "수분 0% 갈라진 땅. 성격 존나 급해서 뭐든 당장 결과 나와야 직성 풀림. 여유라곤 1도 없어서 금방 지치니까 워라밸 좀 챙겨." },
    "토다금매 (土多金埋)": { title: "흙수저 탈출 지연", genz_text: "흙더미에 파묻힌 보석. 내 재능 쩌는데 밖으로 안 드러나서 개답답함. 나대야 할 타이밍에 눈치 보다가 기회 놓침. 제발 나대라!" },
    "금다수탁 (金多水濁)": { title: "생각 과다, 흙탕물", genz_text: "맹물에 흙탕물 섞임. 생각이 너무 많아서 머리에 과부하 옴. 맑은 직관력이 잡생각 때문에 오염되니 멘탈 디톡스 명상 강추." }
  },

  // [4] 특수 및 치트키 구조 (Special & Cheat-key Structures)
  special_structures: {
    "간여지동 (干與支同)": { title: "내 고집에 발등 찍힘", genz_text: "내 자존심이 내 인생의 유일한 적. 죽어도 굽히기 싫어서 손해 보는 거 알면서도 끝까지 밀고 감. 똥고집 부리다 이불킥 예약." },
    "양기성상격 (兩氣成象)": { title: "흑백논리, 모 아니면 도", genz_text: "극단적 밸런스 게임. 회색 지대 없음. 좋으면 내 간 다 빼주고 싫으면 1초 만에 싹둑 자름. 극단적인 롤러코스터 성격." },
    "천원일기 (天元一氣)": { title: "우주 뚫는 고집, 외골수", genz_text: "천간에 같은 글자만 4개 쫙 깔림. 내가 짱이라는 자아 비대칭 우주급. 한 가지 분야 미친 듯이 파서 1인자 되는 무서운 집념." },
    "지전일기 (地全一氣)": { title: "환경 뚝심, 안 변함", genz_text: "지지에 같은 글자만 쫙 깔림. 지구가 두 쪽 나도 내 생활 패턴 안 바꿈. 융통성은 없는데 그 변함없는 묵직함이 무기가 됨." },
    "귀록격 (歸祿格)": { title: "말년 떡상, 자식 복", genz_text: "존버의 아이콘. 젊을 때 개고생해도 시주에 '건록' 깔아서 말년에 돈방석 앉고 자식 효도 받음. 노후 준비 제일 탄탄한 팔자." },
    "비천녹마격 (飛天祿馬)": { title: "백수인데 돈 나옴", genz_text: "명리학계의 해리포터. 사주에 돈(재성)이랑 관(관성)이 안 보이는데 보이지 않는 기운을 끌어와서 벼락부자 되는 미친 치트키." },
    "암록격 (暗祿格)": { title: "비상금 천재, 꽁돈", genz_text: "지갑에 구멍 나도 어디선가 누가 현찰 꽂아줌. 아무도 모르는 비자금 은닉 천재라 평생 굶을 걱정 없는 숨겨진 알부자." },
    "명관과골 (明官跨馬)": { title: "갓벽한 남편/직장", genz_text: "결혼운 레전드. 관(남편/직장)이 돈(재성) 위에 딱 앉아 있음. 나를 호강시켜줄 짱짱한 배우자나 신의 직장 만나는 VIP 티켓." },
    "거류서배 (去留舒配)": { title: "똥차 가고 벤츠 옴", genz_text: "나 괴롭히던 나쁜 놈(기신)은 귀신같이 날아가고, 나 도와줄 좋은 놈(용신)만 딱 남음. 인생 필터링 기가 막히게 돌아가는 해독 타임." },
    "재관쌍미 (財官雙美)": { title: "돈과 가오 다 잡음", genz_text: "밸런스 파괴범. 일지에 돈(정재)과 명예(정관)를 동시에 깔고 앉음. 돈도 잘 벌고 남들한테 인정도 받는 갓벽한 육각형 인생." },
    "수목응결 (水木凝結)": { title: "얼어붙어 멈춤", genz_text: "동파 주의. 너무 추워서 나무(내 멘탈)가 얼어 터짐. 우울증 쎄게 오고 아무것도 하기 싫어지니 당장 전기장판 키고 귤 까먹으면서 쉬어라." }
  },

  // [5] 복합 십성 및 신살 조합 (Complex Ten Gods & Shinsal Analysis)
  complex_narratives: {
    "무재(無財) + 식상 발달": { description: "과정은 좋으나 결과 부족", genz_text: "호기심 터져서 일은 엄청 벌리는데 수습을 못 함. 돈 모으는 거 극혐하고 '경험이 재산이지~' 정신승리하는 뼈 때리는 팩폭러." },
    "무관(無官) + 역마살/지살": { description: "규율 혐오, 이동 즐김", genz_text: "오피스 알레르기 걸린 프리랜서. 9 to 6 사무실에 갇히면 숨 막혀 죽는 병에 걸림. 한 곳에 정착 못 하고 떠도는 디지털 노마드 체질." },
    "상관(傷官) + 도화살": { description: "언변과 매력으로 이목 집중", genz_text: "어그로 끌어 돈 버는 인플루언서 재질. 말 맵게 하는데 묘하게 매력 있어서 사람들 다 홀림. Hater도 팬으로 만드는 치명적 매력." },
    "편관(偏官) + 괴강/백호살": { description: "극난 극복, 압도적 카리스마", genz_text: "인생 하드모드 깬 최종 보스. 남들 멘탈 털릴 억까 상황에서도 피 철철 흘리며 살아남는 전투 민족. 기가 너무 쎄서 범접 불가." },
    "정관(正官) + 정재(正財)": { description: "모범적, 안정적, 보수적", genz_text: "K-장녀/장남 재질의 인간 엑셀표. 가성비에 미쳤고 FM 정석대로 사는 노잼 갓생러. 따박따박 월급 모으는 안정 추구형 끝판왕." },
    "편인(偏印) + 귀문관살": { description: "깊은 통찰력, 마니아", genz_text: "신내림 직전의 딥한 오타쿠. 눈치백단 수준을 넘어 돗자리 깔아도 됨. 마이너한 취미 파고들어서 그 구역 장인 되는 천재." },
    "재다신약(財多身弱)": { description: "기회는 많으나 실속 부족", genz_text: "아이디어 뱅크인데 통장은 텅장. 돈 냄새는 기가 막히게 맡고 스케일은 큰데, 정작 내 손에 떨어지는 실속은 부족함. 지름신 주의." },
    "식상생재": { description: "아이디어를 재물로 연결", genz_text: "N잡러, 사이드 허슬 천재. 내 재능과 입방정을 전부 돈으로 환전하는 미친 재테크 능력. 취미가 본업 씹어먹는 자본주의 괴물." },
    "관성다자 + 무인성": { description: "책임감 막중, 보상 적음", genz_text: "독박 쓰는 K-직장인. 일은 혼자 다 쳐내고 책임감 쩌는데 윗사람한테 인정 못 받아서 속앓이함. 거절 못 하는 호구병 치료 시급." },
    "인성다자 + 무식상": { description: "생각 과다, 실행력 부족", genz_text: "머릿속에선 이미 지구 정복 끝낸 게으른 천재. 생각만 100만 번 하고 막상 이불 밖으로 안 나옴. 일단 몸부터 움직여!" },
    "현침살 + 상관/칠살": { description: "예리하고 비판적인 성향", genz_text: "인간 메스, 팩트 살인마. 말 한마디로 사람 순살 만듦. 그 예리함으로 전문직(의료/IT/디자인) 가면 대박 날 팔자." },
    "비겁다자 + 무관": { description: "자아 비대증, 간섭 거부", genz_text: "자존감 에베레스트, 내 인생의 CEO. 남의 말 죽어도 안 듣는 똥고집. 조직 생활 불가하니 내 맘대로 판 깔고 노는 게 정답." },
    "식신(食神) + 정인(正印)": { description: "의식주 풍족, 사랑받음", genz_text: "태평평화 인간 카피바라 재질. 가만히 숨만 쉬어도 사람들이 밥 챙겨주고 우쭈쭈 해주는 럭키 라이프. 타고난 복 누리며 살 것." },
    "쟁재 (비겁 다수 + 재성 1개)": { description: "재물을 두고 경쟁함", genz_text: "소매치기 주의, 호구 탈출 시급. 주변에 사람 엄청 많은데 결국 내 밥그릇 뺏어가는 적들임. 지갑 사수 안 하면 텅장 됨." },
    "천간합 + 나체도화": { description: "은밀한 이성 문제", genz_text: "만인의 유죄인간, 톡식한 로맨스. 내가 안 꼬셔도 상대방이 알아서 말려드는 블랙홀 매력. 환승 연애나 꼬인 연애사 상시 주의." }
  },
  // [1] 신살별 상세 분석 (Shinsal Master Analysis)
  shinsal_master: {
    "천을귀인": {
      meaning: "최고의 길신, 신의 보호, 사회적 성공",
      recommended_jobs: "모든 분야 (어려운 상황에서 도움을 받음)",
      cautions: "형충파해나 공망 시 기운 반감"
    },
    "문창/학당": {
      meaning: "학문, 글쓰기, 총명, 지적 호기심",
      recommended_jobs: "문서, 출판, 교육, 학문, 연구, 강의",
      cautions: "-"
    },
    "금여/암록": {
      meaning: "재물 관련 길신 (암록은 숨겨진 재물)",
      recommended_jobs: "사업, 금융, 투자",
      cautions: "노력 대비 재물이 모이거나 은밀한 재물운 따름"
    },
    "월덕귀인": {
      meaning: "온화, 자비, 도덕적 평가 높음",
      recommended_jobs: "대인관계 중심 업무, 리더십",
      cautions: "월지에 있을 경우에만 강력하게 작용"
    },
    "괴강살": {
      meaning: "강인한 의지, 카리스마, 결단력",
      recommended_jobs: "출세한 여성, 국회의원, 판검사, 장관",
      cautions: "지나치면 독단적이거나 고집이 매우 셈"
    },
    "백호살": {
      meaning: "강력한 에너지, 위엄, 강한 정신력",
      recommended_jobs: "관리자, 군/경, 경영자, 정치인",
      cautions: "직설적, 극단적 환경에서 능력 발휘 (이별 암시 주의)"
    },
    "역마살": {
      meaning: "이동, 변화, 자유 (기둥에 3개 이상 시 강함)",
      recommended_jobs: "여행, 무역, 영업, 운송, 해외 업무, 프리랜서",
      cautions: "안정적인 정착이 필요할 때 의식적 균형 노력 필요"
    },
    "간여지동": {
      meaning: "강한 자아, 추진력 (일간=일지 동기)",
      recommended_jobs: "독립적 사업가, 리더십 발휘 분야",
      cautions: "감정 기복 크고 타협 어려움, 배우자와 충돌 주의"
    },
    "도화살": {
      meaning: "친근함, 인기, 시선 집중",
      recommended_jobs: "연예인, 모델, 배우, 미디어, 예술",
      cautions: "자오묘유 중 '진도화' 조건 성립 시 진짜 도화"
    },
    "현침살": {
      meaning: "정교함, 예리함, 직선적 (갑,신,오,묘,미,신)",
      recommended_jobs: "외과/한의사, 법률, 정밀 기술, IT, 세밀한 예술",
      cautions: "정확성과 신념이 중요한 직업에서 두드러짐"
    },
    "곡각살": {
      meaning: "꼼꼼함, 기획 분석력 (을,기,사,축)",
      recommended_jobs: "마케팅 기획, 데이터 분석, 상담, 힐링",
      cautions: "책임감 높으나 예민할 수 있음"
    },
    "천문성": {
      meaning: "직감, 신비, 영감 (해,묘,미,인,유,술)",
      recommended_jobs: "종교, 철학, 심리상담, 천문학, 정신세계",
      cautions: "직감이 매우 발달함"
    },
    "천라지망": {
      meaning: "진, 술, 해, 묘 (일지 기준 성립 시)",
      recommended_jobs: "역술, 종교, 심리학, 의학, 명상, 기수련",
      cautions: "동착운(운에서 겹칠 때) 시기 투자/창업 주의"
    }
  },

  // [2] 결혼 시기 및 개운법 (Marriage Timing & Strategy)
  marriage_logic: {
    "조기 결혼": {
      condition: "연주 / 월주에 관성(여)/재성(남) 존재",
      recommended_timing: "나이 상관 없음 ~ 33세 이전",
      advice: "연주 위치 시 일찍 연애/결혼. 주말부부나 업상대체 직업 추천"
    },
    "적정/보통": {
      condition: "일지에 관성(여)/재성(남) 존재",
      recommended_timing: "나이 상관 없음",
      advice: "일지는 천륜의 위치. 편관 직업(군경, 활인업 등) 시 매우 좋음"
    },
    "만혼 추천": {
      condition: "시주에 관성(여)/재성(남) 존재",
      recommended_timing: "38세 이후",
      advice: "연하를 만나거나 배우자를 경시할 우려 있음. 존중하는 태도 필요"
    },
    "과다 (3개↑)": {
      condition: "관성(여) / 재성(남) 다자",
      recommended_timing: "33세 이후 (연결 시) / 38세 이후 (흩어질 시)",
      advice: "여: 통제성 강해 스트레스 / 남: 재물, 연애 관심 과다, 배우자 간섭"
    },
    "무자 (없음)": {
      condition: "원국 및 지장간에 관/재성 없음",
      recommended_timing: "38세 이후 (무조건 늦게)",
      advice: "대운/세운에 관성(여)/재성(남) 들어올 때 결혼운. 여럿 만나보고 결정"
    }
  },

  // [3] 배우자 및 인생 우선순위 (Spouse & Priorities by Day Branch)
  spouse_priority_logic: {
    "비견": {
      spouse_trait: "독립적, 대등한 파트너, 간섭 싫어함",
      male_priority: ["형제/친구", "본인", "배우자"],
      female_priority: ["본인", "자매/친구", "배우자"]
    },
    "겁재": {
      spouse_trait: "열정적, 자극적, 경쟁심 강함",
      male_priority: ["형제/친구", "본인", "배우자(경쟁자 인식)"],
      female_priority: ["자매/친구", "본인", "배우자(주도권 싸움)"]
    },
    "식신": {
      spouse_trait: "낙천적, 온화, 따뜻한 배려",
      male_priority: ["자녀", "배우자", "본인 여유"],
      female_priority: ["자녀", "가정", "본인 만족/취미"]
    },
    "상관": {
      spouse_trait: "독창적, 매력적, 자유 분방함",
      male_priority: ["자녀(자유롭게)", "본인 개성", "배우자"],
      female_priority: ["자녀", "본인 개성", "본인 만족(대외활동)"]
    },
    "편재": {
      spouse_trait: "외향적, 대인관계 좋음, 활동적",
      male_priority: ["배우자(애정)", "사회적 성공", "외부 활동"],
      female_priority: ["사회적 관계", "경제적 안정", "배우자"]
    },
    "정재": {
      spouse_trait: "안정적, 헌신적, 실용적, 책임감",
      male_priority: ["배우자(가장 책임)", "경제 안정", "부모"],
      female_priority: ["가정 생활", "배우자", "부모"]
    },
    "편관": {
      spouse_trait: "열정적, 강렬함, 직설적, 예민함",
      male_priority: ["자녀(엄격 교육)", "성공/명예", "배우자(보호)"],
      female_priority: ["사회적 성공", "자녀(강한 엄마)", "배우자"]
    },
    "정관": {
      spouse_trait: "성실, 규범 준수, 신뢰 우선",
      male_priority: ["자녀(모범적 가장)", "배우자", "사회적 신뢰"],
      female_priority: ["배우자", "가정", "자녀(양육/교육)"]
    },
    "편인": {
      spouse_trait: "독창적, 개성 강함, 독립적 태도",
      male_priority: ["어머니(거리감)", "본인 내면", "배우자(의존)"],
      female_priority: ["본인(내면 세계)", "자녀", "배우자"]
    },
    "정인": {
      spouse_trait: "지혜롭고 배려심 많음, 안정감",
      male_priority: ["어머니(유대 강함)", "자녀", "배우자"],
      female_priority: ["자녀(모성애)", "부모", "배우자(가족 우선)"]
    }
  },

  // [4] 대운/세운 팩폭 해설 지침 (Gen Z Fortune Instructions)
  fortune_genz_logic: {
    "Yong_Yong": {
      combo: "용신 (Good) + 용신 (Good)",
      genz_text: "👑 갓모드 켰음. 대운 세운 쌍끌이 버프! 숨만 쉬어도 돈 들어오고 일 풀림. 쫄지 말고 하고 싶은 거 다 질러! 지금 안 지르면 평생 후회함."
    },
    "Gi_Gi": {
      combo: "기신 (Bad) + 기신 (Bad)",
      genz_text: "💀 헬게이트 오픈. 억까의 연속. 올해는 닥치고 존버가 답. 투자, 창업, 이직 다 안 됨. 그냥 현상 유지만 해도 올해는 승리자임."
    },
    "Yong_Gi": {
      combo: "용신 (Good) + 기신 (Bad)",
      genz_text: "🚧 고속도로 위 과속 방지턱. 전체적인 큰 틀은 떡상장인데, 올해 잠깐 잔파도 치는 중. 잠깐 짜증 나도 큰 문제 안 되니 멘탈 흔들리지 마."
    },
    "Gi_Yong": {
      combo: "기신 (Bad) + 용신 (Good)",
      genz_text: "🏝️ 사막에서 만난 오아시스. 팍팍한 10년 중에 올해 반짝 꿀 빠는 해. 올해 들어오는 돈이나 기회 꽉 잡아서 비상식량으로 비축해둬야 함."
    },
    "Bi_Bi": {
      combo: "비겁운 + 비겁운",
      genz_text: "인맥 다이어트 대실패. 사람 미친 듯이 꼬이는데 돈은 다 털림. 내가 쏘는 병 도져서 텅장 되니 지갑 철사로 묶어두고 독고다이 훈련해."
    },
    "Bi_Sik": {
      combo: "비겁운 + 식상운",
      genz_text: "친구들이랑 입 털면서 창업 아이디어 봇물 터짐. 크루 만들어서 유튜브나 팝업스토어 하면 대박 날 각. 텐션 높여서 다 같이 으쌰으쌰 해."
    },
    "Bi_Jae": {
      combo: "비겁운 + 재성운",
      genz_text: "군겁쟁재! 내 돈 노리는 도둑놈들 천지 삐까리임. 친구랑 동업? 돈 빌려주기? 절대 금지. 차라리 내 돈으로 나한테 투자해서 돈을 묶어."
    },
    "Bi_Gwan": {
      combo: "비겁운 + 관성운",
      genz_text: "치열한 승진/취업 서바이벌. 경쟁자 뚝배기 깨고 내가 1짱 먹는 해. 멘탈은 갈리겠지만 전투력 만렙 찍어서 타이틀 쟁취할 수 있음."
    },
    "Bi_In": {
      combo: "비겁운 + 인성운",
      genz_text: "자기애 맥스. 세상 중심이 나임. 고집 존나 쎄져서 남의 말 절대 안 들음. 똥고집 부리다 주변 사람 다 떠나니 제발 남의 조언 좀 들어."
    },
    "Sik_Bi": {
      combo: "식상운 + 비겁운",
      genz_text: "인싸력 폭발. 동호회, 모임 나가면 내가 센터임. 에너지 주체 못 하고 여기저기 싸돌아다니며 핫플 도장 깨기 하느라 체력 방전 주의."
    },
    "Sik_Sik": {
      combo: "식상운 + 식상운",
      genz_text: "오지랖 + 실행력 브레이크 고장. 하고 싶은 거 100개 다 벌려놓고 수습 불가. 입방정 떨다 구설수 오를 수 있으니 입술에 지퍼 달아라."
    },
    "Sik_Jae": {
      combo: "식상운 + 재성운",
      genz_text: "💰 식상생재 터졌다! 아이디어가 곧 현찰이 됨. 사이드 프로젝트, N잡 무조건 시작해. 입으로 털고 손으로 만들어서 돈 쓸어 담는 해."
    },
    "Sik_Gwan": {
      combo: "식상운 + 관성운",
      genz_text: "상관견관 발동! 꼰대 상사 뚝배기 깨고 싶어지는 퇴사병 말기. 홧김에 사표 던지지 말고, 그 반항심을 내 실력 키우는 데 써서 이직해."
    },
    "Sik_In": {
      combo: "식상운 + 인성운",
      genz_text: "인성용식. 내가 배운 지식을 기가 막히게 써먹음. 자격증 따서 바로 취업하거나, 내 전문 지식으로 남들 컨설팅해주며 전문가 폼 잡는 해."
    },
    "Jae_Bi": {
      combo: "재성운 + 비겁운",
      genz_text: "번 돈 친구들이랑 술값으로 다 탕진. 겉으론 돈 많아 보이는데 실속은 마이너스. 밥값 쏘는 거 멈추고 제발 강제 적금부터 부어라."
    },
    "Jae_Sik": {
      combo: "재성운 + 식상운",
      genz_text: "허슬러 모드 ON. 돈 버는 재미에 미쳐서 24시간 풀가동함. 과정도 즐겁고 결과(통장)도 달달함. 과로해서 병원비로 나가는 것만 조심."
    },
    "Jae_Jae": {
      combo: "재성운 + 재성운",
      genz_text: "자본주의 괴물 강림. 뇌 구조가 오직 '돈'으로만 돌아감. 투자, 영끌, 영수증 줍기 다 좋은데 사기꾼도 같이 꼬이니 계약서 10번 읽어."
    },
    "Jae_Gwan": {
      combo: "재성운 + 관성운",
      genz_text: "재생관 떡상. 내 돈과 실력을 투자해서 결국 명예(간판/타이틀/승진)를 얻음. 조건 쩌는 완벽한 파트너(남편/아내) 만날 결혼 골든타임."
    },
    "Jae_In": {
      combo: "재성운 + 인성운",
      genz_text: "재극인 딜레마. 돈 벌려니 내 양심/도덕이 찔림. 현실(돈)이랑 이상(공부) 사이에서 갈팡질팡. 영끌해서 부동산/문서 잡기 딱 좋은 타이밍."
    },
    "Gwan_Bi": {
      combo: "관성운 + 비겁운",
      genz_text: "관성으로 라이벌 짓누름. 피 튀기는 경쟁에서 내 간판(학벌/직장) 내세워 압살함. 스트레스는 쩔지만 결국 내가 트로피 쥠."
    },
    "Gwan_Sik": {
      combo: "관성운 + 식상운",
      genz_text: "관재수 조심! 룰 어기고 꼼수 쓰다가 딱 걸림. 과속 딱지, 세금 문제, 직장 내 징계 등 내 밥그릇 깨질 수 있으니 FM대로 정직하게 살아라."
    },
    "Gwan_Jae": {
      combo: "관성운 + 재성운",
      genz_text: "승진 하이패스. 회사에서 인정받고 연봉 앞자리 바뀜. 뇌물이나 로비 엄청 잘 통하는 타이밍인데 불법은 절대 선 넘지 말 것."
    },
    "Gwan_Gwan": {
      combo: "관성운 + 관성운",
      genz_text: "가오 살리다 과로사. 책임감 에베레스트라 남의 일까지 다 떠안고 야근함. 완장 차고 권력 잡는 건 좋은데 멘탈 관리 안 하면 쓰러짐."
    },
    "Gwan_In": {
      combo: "관성운 + 인성운",
      genz_text: "관인상생 엘리트 코스. 상사/교수님 프리패스. 내가 굳이 안 나서도 윗사람이 알아서 날 스카우트하고 끌어올려 주는 취뽀/합격의 해."
    },
    "In_Bi": {
      combo: "인성운 + 비겁운",
      genz_text: "자격증, 문서 따서 내 스펙 올림. 근데 고집이 우주 최강 돼서 남 조언 귓등으로 안 들음. 지식은 찼는데 융통성 제로인 선비 모드."
    },
    "In_Sik": {
      combo: "인성운 + 식상운",
      genz_text: "게으른 완벽주의자. 머릿속에선 이미 노벨상 받았는데 침대에서 안 일어남. 인풋(공부)만 하고 아웃풋을 안 하니 제발 입 밖으로 내뱉어라."
    },
    "In_Jae": {
      combo: "인성운 + 재성운",
      genz_text: "머리 굴려서 돈 버는 재테크 장인. 책으로 배운 지식을 실전 투자에 써먹음. 문서운 터져서 집 계약이나 청약 당첨 노려볼 만한 해."
    },
    "In_Gwan": {
      combo: "인성운 + 관성운",
      genz_text: "존버 승리. 개고생하던 시험/취준 드디어 끝남. 합격 통보받고 명예로운 자리 꿰참. 도장 찍을 일(합격, 취업, 결혼) 쏟아지는 축복 구간."
    },
    "In_In": {
      combo: "인성운 + 인성운",
      genz_text: "현실 로그아웃. 속세 다 버리고 산에 들어가고 싶어짐. 우울증, 망상증 돋아서 사람 안 만나고 방구석 은둔형 외톨이 될 수 있으니 밖으로 나가."
    },
    "Yong_Sik_Gi_Sang": {
      combo: "식신운 (용신) + 상관운 (기신)",
      genz_text: "재능은 폭발하는데 말실수로 다 깎아 먹음. 일은 찰떡같이 해놓고 윗사람한테 말대꾸해서 미움받으니 입술 꽉 깨물어."
    },
    "Yong_Gwan_Gi_Pyeon": {
      combo: "정관운 (용신) + 편관운 (기신)",
      genz_text: "직장 잘 다니다가 갑자기 헬부서로 발령 남. 워라밸 박살 나고 극한 직업 체험함. 도망치지 말고 이거 버티면 내년에 무조건 보상 따름."
    },
    "Yong_Jae_Gi_Pyeon": {
      combo: "정재운 (용신) + 편재운 (기신)",
      genz_text: "따박따박 월급 잘 모으다가 갑자기 주식/코인 단타 치고 싶어 안달 남. 한 탕 노리다 모아둔 시드까지 다 털리니 도박 절대 금지."
    },
    "Yong_In_Gi_Pyeon": {
      combo: "정인운 (용신) + 편인운 (기신)",
      genz_text: "정상적으로 공부 잘하다가 갑자기 사이비나 마이너한 철학에 빠짐. 엉뚱한 정보 믿고 헛짓거리 할 수 있으니 객관적 팩트 체크 필수."
    },
    "Dohwa_Gwan_Sync": {
      combo: "도화운 진입 + 관성운 동착",
      genz_text: "스캔들 빵 터짐. 직장에서 치명적 매력 흘리다가 사내 연애 얽히고설켜서 구설수 오름. 어장 관리 금지, 한 놈만 패라."
    },
    "Yeokma_Jae_Sync": {
      combo: "역마운 진입 + 재성운 동착",
      genz_text: "글로벌 허슬러. 캐리어 끌고 해외로 떠나서 외화 벌어옴. 해외 주식, 직구 대행, 유튜버 등 물 건너는 아이템 잡으면 돈 떡상함."
    },
    "Cheoneul_Chung_Sync": {
      combo: "천을귀인 대운 + 충(沖) 세운",
      genz_text: "차가 폐차 수준으로 박살 났는데 나는 털끝 하나 안 다친 기적. 올해 아무리 빡센 위기가 와도 보이지 않는 쉴드가 날 무조건 살려줌."
    },
    "Yangin_Pyeongan_Sync": {
      combo: "양인살 대운 + 편관 세운",
      genz_text: "전쟁터의 불도저. 내 인생 가장 빡세고 험난한 미션이 떨어짐. 근데 내 전투력이 만렙이라 피 철철 흘려도 결국 적장 목 따고 우승함."
    },
    "Wonjin_Bigeob_Sync": {
      combo: "원진살 대운 + 비겁 세운",
      genz_text: "지독한 혐관 서사. 내 짱친이나 동료랑 이유 없이 삐걱대고 미워함. 서로 긁는 말만 골라서 하니 올해는 쿨하게 각자 도생하는 게 답."
    },
    "Gongmang_Jae_Sync": {
      combo: "공망 대운 + 재성 세운",
      genz_text: "밑 빠진 독에 돈 붓기. 미친 듯이 벌었는데 나중에 보니 통장에 남은 게 0원. 물질적 소유욕 비우고 여행이나 기부에 돈 쓰면 오히려 액땜됨."
    },
    "Cheonla_In_Sync": {
      combo: "천라지망 대운 + 인성 세운",
      genz_text: "강제 정신 수양. 현실에서 나대면 다 묶이고 꼬임. 방구석에서 책 읽고 명상하고 자격증 공부하는 'AS 수리 기간'으로 써야 내년에 날아오름."
    },
    "Sang_Hyeon_Sync": {
      combo: "상관 대운 + 현침 세운",
      genz_text: "입에 메스 달렸음. 팩트로 뼈 때리다 못해 골수를 빼먹음. 네 말 다 맞는데 상대방 멘탈 바사삭 되니까 필터링 3번 거치고 말해."
    },
    "Pyeon_Baek_Sync": {
      combo: "편인 대운 + 백호 세운",
      genz_text: "신내림 급 촉. 촉이 너무 좋아서 무서울 지경. 주식 차트 흐름이나 사람 거짓말 귀신같이 맞춤. 단, 피로도 MAX니 멘탈 케어 필수."
    },
    "SikJae_Hap_Sync": {
      combo: "식상생재 대운 + 합(合) 세운",
      genz_text: "투자 파트너 기가 막히게 만남. 내 아이디어와 남의 자본이 완벽하게 믹스돼서 사업 떡상함. 올해 들어오는 제안 무조건 긍정 검토!"
    },
    "GunJae_Pa_Sync": {
      combo: "군겁쟁재 대운 + 파(破) 세운",
      genz_text: "믿었던 도끼에 발등 썰림. 돈 빌려줬다 떼이고, 동업하다 뒤통수 맞음. 올해는 가족이라도 돈거래 절대 금지, 계약서에 도장 찍지 마."
    },
    "JaeIn_Won_Sync": {
      combo: "재극인 대운 + 원진 세운",
      genz_text: "돈이냐 양심이냐 피 말리는 고민. 불법적인 달콤한 유혹 들어오는데 이거 덥석 물면 밤마다 죄책감에 이불킥함. 정도(FM)를 걸어라."
    },
    "GwanIn_Dohwa_Sync": {
      combo: "관인상생 대운 + 도화 세운",
      genz_text: "엘리트 관종. 공부 잘하고 일 잘하는 모범생인데 은근히 인기까지 터짐. 엄친아/엄친딸 타이틀 달고 만인의 부러움 사는 갓벽한 해."
    },
    "GwanMix_Yeokma_Sync": {
      combo: "관살혼잡 대운 + 역마 세운",
      genz_text: "프로 이직러. 여기 회사도 빡세고 저 회사도 빡세서 1년 내내 메뚜기처럼 이직 알아봄. 한 곳에 정착 못 하니 프리랜서로 전향 추천."
    },
    "SikGwan_Hyeong_Sync": {
      combo: "식신제살 대운 + 삼형 세운",
      genz_text: "해결사 등판. 남들 다 망했다고 던져둔 헬프로젝트, 내가 총대 메고 기적처럼 살려냄. 고생은 오지게 하지만 연봉 협상 카드로 최고임."
    },
    "NoJae_Jae_Entry": {
      combo: "무재 사주 + 재성 세운 진입",
      genz_text: "가뭄 끝에 단비. 평생 돈 개념 없던 사람도 올해는 갑자기 재테크에 눈 뜸. 돈 버는 감각 확 살아나니 무조건 적금/투자 시작해."
    },
    "NoGwan_Gwan_Entry": {
      combo: "무관 사주 + 관성 세운 진입",
      genz_text: "자유로운 영혼 강제 취직. 맨날 프리하게 놀던 욜로족이 갑자기 대기업 사원증 목에 걸고 FM 직장인 됨. 빡세도 꾹 참고 버텨봐."
    }
  }
}
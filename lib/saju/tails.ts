// 아홉 꼬리 = 아홉 섹션. UI(꼬리 아이콘·제목)와 프롬프트가 같은 이름을 쓰도록 한 곳에 둔다. 저널 질문은 모두에게 같은 공통 질문(코드 고정, AI가 쓰지 않음).
export const TAILS = [
  { n: 1, color: 'red', hex: '#ef4444', title: 'The Red Tail: Who You Really Are', journal: 'What part of yourself do you hide from most people, and what would change if you stopped?' },
  { n: 2, color: 'orange', hex: '#f97316', title: 'The Orange Tail: The Child You Were', journal: 'What did the younger you need to hear that nobody said?' },
  { n: 3, color: 'yellow', hex: '#facc15', title: 'The Yellow Tail: Where You Are Now', journal: 'What is one thing in your life right now that you are ready to stop carrying?' },
  { n: 4, color: 'green', hex: '#22c55e', title: 'The Green Tail: Your Work and Calling', journal: 'If money and approval were not a worry, what would you build this year?' },
  { n: 5, color: 'blue', hex: '#3b82f6', title: 'The Blue Tail: Your Money Flow', journal: 'What does "enough" look like for you, and what is one step toward it this month?' },
  { n: 6, color: 'indigo', hex: '#6366f1', title: 'The Indigo Tail: Your Heart and Love', journal: 'What do you need from love that you have been afraid to ask for?' },
  { n: 7, color: 'violet', hex: '#a855f7', title: 'The Violet Tail: A Letter From Your Future', journal: 'What would the you of 2030 thank you for starting today?' },
  { n: 8, color: 'white', hex: '#f8fafc', title: 'The White Tail: Your Sacred Space', journal: 'Where do you feel most like yourself, and how can you spend a little more time there?' },
  { n: 9, color: 'black', hex: '#1f2937', title: 'The Black Tail: Your Next Chapter', journal: 'What is the one promise you want to make to yourself for the next ten years?' },
] as const

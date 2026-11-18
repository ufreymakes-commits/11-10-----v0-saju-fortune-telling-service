// Verbatim copies of reviews shown on the site (app/page.tsx TEXT_REVIEWS), kept here so email copy
// does not depend on site component code. Long reviews are cut at a sentence boundary, words unchanged.
export interface EmailReview {
  text: string
  name: string
  region: string
}

export const REVIEW_EMILY: EmailReview = {
  text: "I received the free Facts First, due to worry that this was going to be a bit like a scam. Once I read through the free facts, I was intrigued and purchased the 99 Report. I'm glad I did. There's so much in here and I felt called out, lol. I really was shocked at how accurately it read me.",
  name: 'Emily W.',
  region: 'New York',
}

export const REVIEW_JASMINE: EmailReview = {
  text: 'I started with the free facts first because I was skeptical and was surprised by how accurate the information I got back was, it was almost scary. I ended up getting the 99 facts and everything I been through and am currently going through was mentioned and it gave me a lot of clarity.',
  name: 'Jasmine S.',
  region: 'New York',
}

export const REVIEW_SALINA: EmailReview = {
  text: 'My JAW dropped! I was so shocked to see how much everything aligned. This reading was like none other.',
  name: 'Salina Chang',
  region: 'US',
}

export const reviewLine = (review: EmailReview): string =>
  `"${review.text}" \u2014 ${review.name}, ${review.region}`

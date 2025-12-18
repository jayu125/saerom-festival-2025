export interface UserProfile {
  uid: string
  email: string
  name: string
  grade: number // 학년
  class: number // 반
  number: number // 번호
  baseMileage: number // 기본 마일리지 (우승 반 계산용)
  multiplier: number // 투자 게임 배수 (1.0 ~ 2.0)
  stampCount: number
  createdAt: Date
  updatedAt: Date
}

export interface BoothVisit {
  boothId: string
  visitedAt: Date
  mileageEarned: number
}

export interface QuizReward {
  boothId: string
  answeredAt: Date
  mileageEarned: number
  isCorrect: boolean
}

export interface Booth {
  id: string
  boothIdx: number // Added boothIdx field for NFC matching
  name: string
  description: string
  floor: number // 층
  location: string
  category: string // Added category field
  imageUrl?: string // Added imageUrl field
  visitCount: number // Added visitCount field for popularity sorting
  quiz?: {
    question: string
    options: string[]
    correctAnswer: number
  }
}

export interface LogEntry {
  id: string
  type: "visit" | "quiz" | "multiplier_change"
  boothId?: string
  previousValue?: number
  newValue?: number
  mileageChange?: number
  timestamp: Date
}

export interface ClassStats {
  grade: number
  classNumber: number
  totalBaseMileage: number
  memberCount: number
  averageMileage: number
}

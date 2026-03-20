// TODO (E12): Once pages are migrated to use repositories, remove the
// duplicate interface definitions in src/api/ (userProfileApi.ts, foodLogApi.ts, etc.)

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: string | null
  statusCode: number
}

export type DietStyle = 'Keto' | 'LowFat' | 'Mediterranean'
export type FoodEntrySource = 'Manual' | 'Photo'
export type AnalysisSeverity = 'None' | 'Low' | 'Medium' | 'High'

export interface UserProfile {
  id: number
  name: string
  dietStyle: DietStyle
  createdAt: string
  lastActiveAt: string | null
}

export interface FoodEntry {
  id: number
  userId: number
  foodName: string
  estimatedCalories: number
  loggedAt: string
  source: FoodEntrySource
  analysisResult: string | null
  imageBase64: string | null
}

export interface FoodIdentificationResult {
  foodName: string
  estimatedCalories: number
  confidenceLevel: number
}

export interface FoodAnalysisResult {
  compatible: boolean
  severity: AnalysisSeverity
  educationText: string
  alternativeFoodName: string | null
  estimatedCalories: number
}

export interface AnalysisPreviewResult {
  compatible: boolean
  severity: AnalysisSeverity
  educationText: string | null
  alternativeFoodName: string | null
  estimatedCalories: number
}

export interface DailyLogSummary {
  date: string
  totalCalories: number
  onGoalCount: number
  conflictCount: number
  complianceLabel: string
}

export interface DailyCalorieSummary {
  date: string
  totalCalories: number
  onGoalCount: number
  conflictCount: number
  hasEntries: boolean
}

export interface WeeklyReport {
  weekStart: string
  weekEnd: string
  dailySummaries: DailyCalorieSummary[]
  totalCalories: number
  complianceRate: number
  patternInsight: string | null
  motivatingCopy: string
}

export interface MonthlyReport {
  monthStart: string
  monthEnd: string
  dailySummaries: DailyCalorieSummary[]
  totalCalories: number
  complianceRate: number
  patternInsight: string | null
  motivatingCopy: string
}

export interface AlternativeBookmark {
  id: number
  userId: number
  alternativeFoodName: string
  imageBase64: string | null
  mimeType: string | null
  createdAt: string
}

export interface AlternativeImageResult {
  imageBase64: string | null
  mimeType: string | null
}

export interface AlternativeSuggestion {
  foodName: string
}

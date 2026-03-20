import { http, HttpResponse } from 'msw'

const mockUser = {
  id: 1,
  name: 'Test User',
  dietStyle: 'Mediterranean',
  createdAt: '2024-01-01T00:00:00Z',
  lastActiveAt: '2024-01-15T10:00:00Z',
}

const mockEntry = {
  id: 10,
  userId: 1,
  foodName: 'Grilled Chicken',
  estimatedCalories: 350,
  loggedAt: '2024-01-15T12:00:00Z',
  source: 'Manual',
  analysisResult: null,
  imageBase64: null,
}

const mockSummary = {
  date: '2024-01-15',
  totalCalories: 350,
  onGoalCount: 1,
  conflictCount: 0,
  complianceLabel: '1 of 1 meals on goal',
}

const mockIdentificationResult = {
  foodName: 'Grilled Chicken',
  estimatedCalories: 350,
  confidenceLevel: 0.92,
}

const mockAnalysisResult = {
  compatible: true,
  severity: 'None',
  educationText: 'Great choice for your diet.',
  alternativeFoodName: null,
  estimatedCalories: 350,
}

const mockPreviewResult = {
  compatible: true,
  severity: 'None',
  educationText: null,
  alternativeFoodName: null,
  estimatedCalories: 350,
}

const mockAlternativeImage = {
  imageBase64: 'abc123',
  mimeType: 'image/jpeg',
}

const mockWeeklyReport = {
  weekStart: '2024-01-15',
  weekEnd: '2024-01-21',
  dailySummaries: [],
  totalCalories: 0,
  complianceRate: 0,
  patternInsight: null,
  motivatingCopy: 'Keep going!',
}

const mockMonthlyReport = {
  monthStart: '2024-01-01',
  monthEnd: '2024-01-31',
  dailySummaries: [],
  totalCalories: 0,
  complianceRate: 0,
  patternInsight: null,
  motivatingCopy: 'Great month!',
}

const mockBookmark = {
  id: 1,
  userId: 1,
  alternativeFoodName: 'Salad',
  imageBase64: null,
  mimeType: null,
  createdAt: '2024-01-15T00:00:00Z',
}

export const handlers = [
  http.post('/api/users', () =>
    HttpResponse.json({ success: true, data: mockUser, error: null, statusCode: 200 })
  ),

  http.get('/api/users/:id', ({ params }) => {
    if (params.id === '999') {
      return HttpResponse.json({ success: false, data: null, error: 'Not found', statusCode: 404 }, { status: 404 })
    }
    return HttpResponse.json({ success: true, data: mockUser, error: null, statusCode: 200 })
  }),

  http.put('/api/users/:id', () =>
    HttpResponse.json({ success: true, data: { ...mockUser, dietStyle: 'Keto' }, error: null, statusCode: 200 })
  ),

  http.delete('/api/users/:id', () =>
    HttpResponse.json({ success: true, data: null, error: null, statusCode: 200 })
  ),

  http.get('/api/food-entries', () =>
    HttpResponse.json({ success: true, data: [mockEntry], error: null, statusCode: 200 })
  ),

  http.get('/api/food-entries/summary', () =>
    HttpResponse.json({ success: true, data: mockSummary, error: null, statusCode: 200 })
  ),

  http.post('/api/food-entries', () =>
    HttpResponse.json({ success: true, data: mockEntry, error: null, statusCode: 200 })
  ),

  http.delete('/api/food-entries/:id', () =>
    HttpResponse.json({ success: true, data: null, error: null, statusCode: 200 })
  ),

  http.post('/api/food-entries/identify', () =>
    HttpResponse.json({ success: true, data: mockIdentificationResult, error: null, statusCode: 200 })
  ),

  http.post('/api/food-entries/analyse-preview', () =>
    HttpResponse.json({ success: true, data: mockPreviewResult, error: null, statusCode: 200 })
  ),

  http.post('/api/food-entries/:id/analyse', () =>
    HttpResponse.json({ success: true, data: mockAnalysisResult, error: null, statusCode: 200 })
  ),

  http.patch('/api/food-entries/:id/analysis', () =>
    HttpResponse.json({ success: true, data: null, error: null, statusCode: 200 })
  ),

  http.get('/api/food-entries/:id/alternative-image', () =>
    HttpResponse.json({ success: true, data: mockAlternativeImage, error: null, statusCode: 200 })
  ),

  http.post('/api/food-entries/:id/suggest-alternative', () =>
    HttpResponse.json({ success: true, data: { foodName: 'Greek Salad' }, error: null, statusCode: 200 })
  ),

  http.post('/api/food-entries/suggest-alternative-preview', () =>
    HttpResponse.json({ success: true, data: { foodName: 'Greek Salad' }, error: null, statusCode: 200 })
  ),

  http.get('/api/food-entries/suggest-image', () =>
    HttpResponse.json({ success: true, data: mockAlternativeImage, error: null, statusCode: 200 })
  ),

  http.get('/api/reports/weekly', () =>
    HttpResponse.json({ success: true, data: mockWeeklyReport, error: null, statusCode: 200 })
  ),

  http.get('/api/reports/monthly', () =>
    HttpResponse.json({ success: true, data: mockMonthlyReport, error: null, statusCode: 200 })
  ),

  http.get('/api/alternatives/bookmarks', () =>
    HttpResponse.json({ success: true, data: [mockBookmark], error: null, statusCode: 200 })
  ),

  http.post('/api/alternatives/bookmarks', () =>
    HttpResponse.json({ success: true, data: mockBookmark, error: null, statusCode: 200 })
  ),

  http.delete('/api/alternatives/bookmarks/:id', () =>
    HttpResponse.json({ success: true, data: null, error: null, statusCode: 200 })
  ),
]

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIdentity } from '../hooks/useIdentity'
import {
  createFoodEntry,
  identifyFood,
  analyseEntry,
  getAlternativeImage,
  type FoodEntrySource,
  type FoodAnalysisResult,
  type AlternativeImageResult,
} from '../api/foodLogApi'
import { createBookmark } from '../api/bookmarksApi'

export default function FoodLoggingPage() {
  const { userId } = useIdentity()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const identifyAbortRef = useRef<AbortController | null>(null)
  const analyseAbortRef = useRef<AbortController | null>(null)
  const imageAbortRef = useRef<AbortController | null>(null)

  useEffect(() => () => {
    identifyAbortRef.current?.abort()
    analyseAbortRef.current?.abort()
    imageAbortRef.current?.abort()
  }, [])

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [foodName, setFoodName] = useState('')
  const [calories, setCalories] = useState('')
  const [source, setSource] = useState<FoodEntrySource>('Manual')
  const [identifying, setIdentifying] = useState(false)
  const [aiIdentified, setAiIdentified] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null)
  const [savedFoodName, setSavedFoodName] = useState('')
  const [savedEntryId, setSavedEntryId] = useState<number | null>(null)
  const [alternativeImage, setAlternativeImage] = useState<AlternativeImageResult | null>(null)
  const [loadingImage, setLoadingImage] = useState(false)
  const [bookmarkSaved, setBookmarkSaved] = useState(false)
  const [bookmarkSaving, setBookmarkSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setSource('Photo')
    setAiIdentified(false)
    if (!userId) return
    identifyAbortRef.current?.abort()
    const controller = new AbortController()
    identifyAbortRef.current = controller
    setIdentifying(true)
    setError(null)
    try {
      const result = await identifyFood(file, parseInt(userId, 10), controller.signal)
      if (!controller.signal.aborted && result && result.foodName) {
        setFoodName(result.foodName)
        setCalories(String(result.estimatedCalories))
        setAiIdentified(true)
      }
    } catch {
      // Vision unavailable — manual entry shown as fallback
    } finally {
      if (!controller.signal.aborted) setIdentifying(false)
    }
  }

  function handleRemovePhoto() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setSource('Manual')
    setAiIdentified(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSave() {
    if (!userId) {
      setError('No user session found. Please return to onboarding.')
      return
    }
    const cal = Math.trunc(parseFloat(calories))
    if (!foodName.trim()) {
      setError('Food name is required.')
      return
    }
    if (isNaN(cal) || cal < 0 || cal > 9999) {
      setError('Please enter a calorie count between 0 and 9999.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const entry = await createFoodEntry(parseInt(userId, 10), foodName.trim(), cal, source)
      setSavedEntryId(entry.id)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setSavedFoodName(foodName.trim())
      setSaving(false)
      setAnalysing(true)
      analyseAbortRef.current?.abort()
      const analyseController = new AbortController()
      analyseAbortRef.current = analyseController
      const result = await analyseEntry(entry.id, analyseController.signal)
      if (analyseController.signal.aborted) return
      setAnalysing(false)
      if (result) {
        setAnalysisResult(result)
        if (!result.compatible && result.alternativeFoodName) {
          imageAbortRef.current?.abort()
          const imgController = new AbortController()
          imageAbortRef.current = imgController
          setLoadingImage(true)
          getAlternativeImage(entry.id, imgController.signal)
            .then(img => {
              if (!imgController.signal.aborted) {
                setAlternativeImage(img)
                setLoadingImage(false)
              }
            })
            .catch(() => {
              if (!imgController.signal.aborted) setLoadingImage(false)
            })
        }
      } else {
        navigate('/')
      }
    } catch (err) {
      setSaving(false)
      setError(err instanceof Error ? err.message : 'Failed to save entry.')
    }
  }

  const showAnalysisPhase = analysing || analysisResult !== null
  const isHighSeverity = analysisResult !== null && !analysisResult.compatible && analysisResult.severity === 'High'

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="glass-modal w-full max-w-md p-10 space-y-6">
        <h1 className="text-display-md text-white font-bold tracking-tight">Log Food</h1>

        {/* Analysis phase */}
        {showAnalysisPhase && (
          <div className="space-y-5 pt-3">
            <p className="text-sm text-glass-muted">
              Saved: <span className="text-glass-text font-medium">{savedFoodName}</span>
            </p>

            {analysing && (
              <div className="space-y-3 animate-pulse" aria-label="Analysing meal">
                <div className="h-24 bg-white/10 rounded-2xl" />
                <p className="text-sm text-glass-muted text-center">Analysing your meal…</p>
              </div>
            )}

            {analysisResult && (
              <div
                className="rounded-2xl p-6 space-y-4"
                style={{
                  background: analysisResult.compatible
                    ? 'rgba(16,185,129,0.06)'
                    : isHighSeverity
                      ? 'rgba(239,68,68,0.06)'
                      : 'rgba(245,158,11,0.06)',
                  border: analysisResult.compatible
                    ? '1px solid rgba(52,211,153,0.35)'
                    : isHighSeverity
                      ? '1px solid rgba(239,68,68,0.45)'
                      : '1px solid rgba(251,191,36,0.40)',
                  boxShadow: analysisResult.compatible
                    ? '0 0 28px rgba(16,185,129,0.08) inset'
                    : isHighSeverity
                      ? '0 0 28px rgba(239,68,68,0.10) inset'
                      : '0 0 28px rgba(245,158,11,0.08) inset',
                }}
              >
                {/* Status header */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {analysisResult.compatible ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
                      <span className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center text-[10px]">✓</span>
                      Great choice!
                    </span>
                  ) : (
                    <>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${
                        isHighSeverity ? 'bg-red-500' : 'bg-amber-500'
                      }`}>
                        {analysisResult.severity}
                      </span>
                      <span className="text-sm text-glass-text font-semibold">Diet conflict detected</span>
                    </>
                  )}
                </div>

                {analysisResult.educationText && (
                  <p className="leading-relaxed" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.88)' }}>{analysisResult.educationText}</p>
                )}

                {analysisResult.alternativeFoodName && (
                  <div className="space-y-2">
                    <p className="text-xs text-glass-muted uppercase tracking-widest" style={{ fontSize: '10px' }}>Try instead</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-semibold"
                        style={{ fontSize: '0.95rem', color: 'rgba(56,189,248,0.95)', letterSpacing: '0.01em' }}
                      >
                        {analysisResult.alternativeFoodName}
                      </span>
                      {!bookmarkSaved && (
                        <button
                          onClick={async () => {
                            if (!userId) return
                            setBookmarkSaving(true)
                            try {
                              await createBookmark(
                                parseInt(userId, 10),
                                analysisResult.alternativeFoodName!,
                                alternativeImage?.imageBase64 ?? null,
                                alternativeImage?.mimeType ?? null
                              )
                              setBookmarkSaved(true)
                            } finally {
                              setBookmarkSaving(false)
                            }
                          }}
                          disabled={bookmarkSaving || loadingImage}
                          className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-50"
                          style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                        >
                          {bookmarkSaving ? 'Saving…' : 'Save for later'}
                        </button>
                      )}
                      {bookmarkSaved && (
                        <span className="text-xs text-emerald-400 font-medium">✓ Saved</span>
                      )}
                    </div>
                  </div>
                )}

                {/* AI-generated alternative image */}
                {!analysisResult.compatible && (
                  <>
                    {loadingImage && (
                      <div className="animate-pulse rounded-xl overflow-hidden h-40 bg-white/10" aria-label="Loading alternative image" />
                    )}
                    {!loadingImage && alternativeImage?.imageBase64 && (
                      <img
                        src={`data:${alternativeImage.mimeType ?? 'image/png'};base64,${alternativeImage.imageBase64}`}
                        alt={`Suggested alternative: ${analysisResult.alternativeFoodName ?? ''}`}
                        className="w-full rounded-xl object-cover max-h-48"
                      />
                    )}
                  </>
                )}

                <button
                  onClick={() => navigate('/')}
                  className="btn-primary w-full py-3"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}

        {/* Entry form — hidden during analysis phase */}
        {!showAnalysisPhase && (
          <>
            {/* Photo capture / file picker */}
            <div className="relative">
              <div className="w-full py-5 px-4 rounded-xl border-2 border-dashed border-white/20 hover:border-brand-500/50 transition-colors flex flex-col items-center justify-center gap-2 text-white/40 hover:text-white/60 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span className="text-sm">{previewUrl ? 'Change photo' : 'Take or upload a photo'}</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>

            {/* Local preview */}
            {previewUrl && (
              <div className="relative rounded-xl overflow-hidden">
                <img src={previewUrl} alt="Food preview" className="w-full h-48 object-cover" />
                <button
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg hover:bg-black/80 transition"
                >
                  Remove
                </button>
              </div>
            )}

            {/* AI identification skeleton loader */}
            {identifying && (
              <div className="space-y-2 animate-pulse" aria-label="Identifying food">
                <div className="h-4 bg-white/20 rounded w-1/3" />
                <div className="h-10 bg-white/10 rounded-xl" />
                <div className="h-4 bg-white/20 rounded w-1/4 mt-2" />
                <div className="h-10 bg-white/10 rounded-xl" />
                <p className="text-xs text-glass-muted text-center pt-1">Identifying food…</p>
              </div>
            )}

            {/* Food name + calories fields */}
            {!identifying && (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="food-name" className="field-label">Food name</label>
                    {aiIdentified && (
                      <span className="text-xs text-brand-400 font-medium">AI identified — you can edit</span>
                    )}
                  </div>
                  <input
                    id="food-name"
                    type="text"
                    value={foodName}
                    onChange={e => { setFoodName(e.target.value); setAiIdentified(false) }}
                    placeholder="e.g. Chicken breast"
                    className="input-glass"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="calories" className="field-label">
                    Estimated calories{aiIdentified ? ' · AI estimate' : ''}
                  </label>
                  <input
                    id="calories"
                    type="number"
                    min="0"
                    max="9999"
                    step="1"
                    value={calories}
                    onChange={e => setCalories(e.target.value)}
                    placeholder="e.g. 300"
                    className="input-glass"
                  />
                </div>
              </>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); navigate('/') }}
                className="btn-ghost flex-1 py-3"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || identifying}
                className="btn-primary flex-1 py-3"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

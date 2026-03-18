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
      <div className="glass-surface-lg w-full max-w-md p-8 space-y-5">
        <h1 className="text-display-md text-glass-text">Log Food</h1>

        {/* Analysis phase */}
        {showAnalysisPhase && (
          <>
            <p className="text-sm text-glass-muted">
              Saved: <span className="text-glass-text font-medium">{savedFoodName}</span>
            </p>

            {analysing && (
              <div className="space-y-3 animate-pulse" aria-label="Analysing meal">
                <div className="h-24 bg-white/10 rounded-xl" />
                <p className="text-sm text-glass-muted text-center">Analysing your meal…</p>
              </div>
            )}

            {analysisResult && (
              <div className={`rounded-xl p-5 space-y-3 ${
                analysisResult.compatible
                  ? 'bg-emerald-500/20 border border-emerald-400/30'
                  : isHighSeverity
                    ? 'bg-red-500/20 border border-red-400/30'
                    : 'bg-amber-500/20 border border-amber-400/30'
              }`}>
                <div className="flex items-center gap-2 flex-wrap">
                  {analysisResult.compatible ? (
                    <span className="text-emerald-300 font-semibold text-sm">✓ Great choice!</span>
                  ) : (
                    <>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isHighSeverity
                          ? 'bg-red-500/30 text-red-300'
                          : 'bg-amber-500/30 text-amber-300'
                      }`}>
                        {analysisResult.severity}
                      </span>
                      <span className="text-sm text-glass-text font-semibold">Diet conflict detected</span>
                    </>
                  )}
                </div>

                {analysisResult.educationText && (
                  <p className="text-sm text-glass-muted">{analysisResult.educationText}</p>
                )}

                {analysisResult.alternativeFoodName && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-sm text-glass-text">
                      <span className="text-glass-muted">Try instead: </span>
                      <span className="font-medium">{analysisResult.alternativeFoodName}</span>
                    </p>
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
                        className="text-xs text-brand-400 hover:underline disabled:opacity-50"
                      >
                        {bookmarkSaving ? 'Saving…' : 'Save for later'}
                      </button>
                    )}
                    {bookmarkSaved && (
                      <span className="text-xs text-emerald-400">Saved</span>
                    )}
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
                  className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm text-glass-text"
                >
                  Done
                </button>
              </div>
            )}
          </>
        )}

        {/* Entry form — hidden during analysis phase */}
        {!showAnalysisPhase && (
          <>
            {/* Photo capture / file picker */}
            <div>
              <input
                ref={fileInputRef}
                id="photo-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="photo-input"
                className="block w-full py-2 px-4 text-center rounded-lg border border-glass-border text-glass-muted cursor-pointer hover:bg-white/10 transition text-sm"
              >
                {previewUrl ? 'Change photo' : 'Take or upload photo (optional)'}
              </label>
            </div>

            {/* Local preview */}
            {previewUrl && (
              <div className="relative rounded-lg overflow-hidden">
                <img src={previewUrl} alt="Food preview" className="w-full h-48 object-cover" />
                <button
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded hover:bg-black/80 transition"
                >
                  Remove
                </button>
              </div>
            )}

            {/* AI identification skeleton loader */}
            {identifying && (
              <div className="space-y-2 animate-pulse" aria-label="Identifying food">
                <div className="h-4 bg-white/20 rounded w-1/3" />
                <div className="h-10 bg-white/10 rounded-lg" />
                <div className="h-4 bg-white/20 rounded w-1/4 mt-2" />
                <div className="h-10 bg-white/10 rounded-lg" />
                <p className="text-xs text-glass-muted text-center pt-1">Identifying food…</p>
              </div>
            )}

            {/* Food name + calories fields — hidden while skeleton is shown */}
            {!identifying && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="food-name" className="text-sm text-glass-muted">Food name</label>
                    {aiIdentified && (
                      <span className="text-xs text-brand-400">AI identified — you can edit</span>
                    )}
                  </div>
                  <input
                    id="food-name"
                    type="text"
                    value={foodName}
                    onChange={e => { setFoodName(e.target.value); setAiIdentified(false) }}
                    placeholder="e.g. Chicken breast"
                    className="w-full bg-white/10 border border-glass-border rounded-lg px-3 py-2 text-glass-text placeholder:text-glass-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="calories" className="text-sm text-glass-muted">
                    Estimated calories{aiIdentified ? ' (~estimate)' : ''}
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
                    className="w-full bg-white/10 border border-glass-border rounded-lg px-3 py-2 text-glass-text placeholder:text-glass-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); navigate('/') }}
                className="flex-1 py-2 rounded-lg border border-glass-border text-glass-muted hover:bg-white/10 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || identifying}
                className="flex-1 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition disabled:opacity-50 text-sm"
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

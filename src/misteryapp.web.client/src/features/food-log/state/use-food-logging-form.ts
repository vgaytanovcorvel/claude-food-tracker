import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIdentity } from '../../../hooks/useIdentity'
import { useServices } from '../../../core/providers'
import { useLogFood } from './use-log-food'
import { useAnalysePreview } from './use-analyse-preview'
import { useCreateBookmark } from '../../bookmarks/state/use-create-bookmark'
import type { FoodEntrySource, FoodAnalysisResult, AlternativeImageResult } from '../../../domain/models'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export interface FoodLoggingFormState {
  // Photo / form state
  previewUrl: string | null
  foodName: string
  identifying: boolean
  aiIdentified: boolean
  saving: boolean
  error: string | null
  // Calorie pill
  calories: number
  calorieUserEdited: boolean
  calorieExpanded: boolean
  calorieEditValue: string
  // Pre-save analysis preview
  previewResult: ReturnType<typeof useAnalysePreview>['previewResult']
  previewedFoodName: string
  previewLoading: boolean
  previewValid: boolean
  previewIsHighSeverity: boolean
  // Pre-save alternative
  preSaveImage: AlternativeImageResult | null
  preSaveImageLoading: boolean
  preSaveCurrentAlternativeName: string | null
  preSaveSuggestClickCount: number
  preSaveSuggestingAlternative: boolean
  preSaveBookmarkSaved: boolean
  preSaveBookmarkSaving: boolean
  // Post-save phase
  showAnalysisPhase: boolean
  analysing: boolean
  analysisResult: FoodAnalysisResult | null
  savedFoodName: string
  alternativeImage: AlternativeImageResult | null
  imageLoading: boolean
  isHighSeverity: boolean
  currentAlternativeName: string | null
  suggestClickCount: number
  suggestingAlternative: boolean
  bookmarkSaved: boolean
  bookmarkSaving: boolean
  // Lightbox
  zoomedImageUrl: string | null
  // Refs
  fileInputRef: React.RefObject<HTMLInputElement | null>
  // Handlers
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRemovePhoto: () => void
  handleFoodNameChange: (value: string) => void
  handleCaloriePillClick: () => void
  handleCalorieConfirm: () => void
  handleSave: () => Promise<void>
  handleSuggestAnother: () => Promise<void>
  handlePreSaveSuggestAnother: () => Promise<void>
  handleBookmark: () => Promise<void>
  handlePreSaveBookmark: () => Promise<void>
  setZoomedImageUrl: (url: string | null) => void
  setCalorieEditValue: (v: string) => void
}

export function useFoodLoggingForm(): FoodLoggingFormState {
  const { userId } = useIdentity()
  const navigate = useNavigate()
  const { foodLogService } = useServices()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoFileRef = useRef<File | null>(null)
  const identifyAbortRef = useRef<AbortController | null>(null)
  const analyseAbortRef = useRef<AbortController | null>(null)
  const imageAbortRef = useRef<AbortController | null>(null)
  const suggestAbortRef = useRef<AbortController | null>(null)
  const preSaveImageAbortRef = useRef<AbortController | null>(null)
  const preSaveSuggestAbortRef = useRef<AbortController | null>(null)
  const immediatePreviewRef = useRef(false)
  const calorieUserEditedRef = useRef(false)

  useEffect(() => () => {
    identifyAbortRef.current?.abort()
    analyseAbortRef.current?.abort()
    imageAbortRef.current?.abort()
    suggestAbortRef.current?.abort()
    preSaveImageAbortRef.current?.abort()
    preSaveSuggestAbortRef.current?.abort()
  }, [])

  // Form state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [foodName, setFoodName] = useState('')
  const [source, setSource] = useState<FoodEntrySource>('Manual')
  const [identifying, setIdentifying] = useState(false)
  const [aiIdentified, setAiIdentified] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calorie pill state
  const [calories, setCalories] = useState(0)
  const [aiCalories, setAiCalories] = useState(0)
  const [calorieUserEdited, setCalorieUserEdited] = useState(false)
  const [calorieExpanded, setCalorieExpanded] = useState(false)
  const [calorieEditValue, setCalorieEditValue] = useState('')

  // Pre-save analysis preview
  const { previewResult, previewedFoodName, previewLoading, clearPreview } = useAnalysePreview({
    foodName,
    userId,
    immediateRef: immediatePreviewRef,
  })

  // Image zoom lightbox
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null)

  // Pre-save alternative image
  const [preSaveImage, setPreSaveImage] = useState<AlternativeImageResult | null>(null)
  const [preSaveImageLoading, setPreSaveImageLoading] = useState(false)

  // Pre-save suggest another / bookmark
  const [preSaveCurrentAlternativeName, setPreSaveCurrentAlternativeName] = useState<string | null>(null)
  const [preSaveShownAlternatives, setPreSaveShownAlternatives] = useState<string[]>([])
  const [preSaveSuggestClickCount, setPreSaveSuggestClickCount] = useState(0)
  const [preSaveSuggestingAlternative, setPreSaveSuggestingAlternative] = useState(false)
  const [preSaveBookmarkSaved, setPreSaveBookmarkSaved] = useState(false)
  const [preSaveBookmarkSaving, setPreSaveBookmarkSaving] = useState(false)

  // Post-save analysis phase
  const [analysing, setAnalysing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null)
  const [savedFoodName, setSavedFoodName] = useState('')
  const [savedEntryId, setSavedEntryId] = useState<number | null>(null)
  const [alternativeImage, setAlternativeImage] = useState<AlternativeImageResult | null>(null)
  const [imageLoading, setLoadingImage] = useState(false)
  const [bookmarkSaved, setBookmarkSaved] = useState(false)
  const [bookmarkSaving, setBookmarkSaving] = useState(false)
  const [currentAlternativeName, setCurrentAlternativeName] = useState<string | null>(null)
  const [shownAlternatives, setShownAlternatives] = useState<string[]>([])
  const [suggestClickCount, setSuggestClickCount] = useState(0)
  const [suggestingAlternative, setSuggestingAlternative] = useState(false)

  const logFood = useLogFood(userId)
  const createBookmark = useCreateBookmark(userId)

  useEffect(() => {
    setPreSaveImage(null)
    preSaveImageAbortRef.current?.abort()
    setPreSaveCurrentAlternativeName(null)
    setPreSaveShownAlternatives([])
    setPreSaveSuggestClickCount(0)
    setPreSaveSuggestingAlternative(false)
    setPreSaveBookmarkSaved(false)
    preSaveSuggestAbortRef.current?.abort()
  }, [foodName, userId])

  function fetchPreSaveAlternativeImage(alternativeFoodName: string, uid: string) {
    setPreSaveCurrentAlternativeName(alternativeFoodName)
    setPreSaveShownAlternatives([alternativeFoodName])
    setPreSaveSuggestClickCount(0)
    setPreSaveBookmarkSaved(false)
    const imgAc = new AbortController()
    preSaveImageAbortRef.current = imgAc
    setPreSaveImageLoading(true)
    foodLogService.getImageForFoodName(alternativeFoodName, parseInt(uid, 10), imgAc.signal)
      .then(img => {
        if (!imgAc.signal.aborted) {
          setPreSaveImage(img)
          setPreSaveImageLoading(false)
        }
      })
      .catch(() => {
        if (!imgAc.signal.aborted) setPreSaveImageLoading(false)
      })
  }

  function applyPreviewCalories(result: NonNullable<typeof previewResult>) {
    if (!calorieUserEditedRef.current && result.estimatedCalories > 0 && aiCalories === 0) {
      setAiCalories(result.estimatedCalories)
      setCalories(result.estimatedCalories)
    }
  }

  useEffect(() => {
    if (!previewResult) return
    applyPreviewCalories(previewResult)
    if (!previewResult.compatible && previewResult.alternativeFoodName && userId) {
      fetchPreSaveAlternativeImage(previewResult.alternativeFoodName, userId)
    }
  }, [previewResult, aiCalories]) // eslint-disable-line react-hooks/exhaustive-deps

  function applyIdentificationResult(result: NonNullable<Awaited<ReturnType<typeof foodLogService.identifyFood>>>) {
    if (result.confidenceLevel >= 0.85) {
      immediatePreviewRef.current = true
    }
    if (!calorieUserEditedRef.current) {
      setAiCalories(result.estimatedCalories)
      setCalories(result.estimatedCalories)
    }
    setFoodName(result.foodName)
    setAiIdentified(true)
  }

  async function identifyPhotoAsync(file: File, controller: AbortController) {
    setIdentifying(true)
    setError(null)
    try {
      const result = await foodLogService.identifyFood(file, parseInt(userId!, 10), controller.signal)
      if (!controller.signal.aborted && result && result.foodName) {
        applyIdentificationResult(result)
      }
    } catch {
      // Vision unavailable — manual entry shown as fallback
    } finally {
      if (!controller.signal.aborted) setIdentifying(false)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    photoFileRef.current = file
    setPreviewUrl(URL.createObjectURL(file))
    setSource('Photo')
    setAiIdentified(false)
    if (!userId) return
    identifyAbortRef.current?.abort()
    const controller = new AbortController()
    identifyAbortRef.current = controller
    await identifyPhotoAsync(file, controller)
  }

  function handleRemovePhoto() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    photoFileRef.current = null
    setSource('Manual')
    setAiIdentified(false)
    setAiCalories(0)
    if (!calorieUserEditedRef.current) setCalories(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleFoodNameChange(value: string) {
    setFoodName(value)
    setAiIdentified(false)
    if (!calorieUserEditedRef.current) {
      setAiCalories(0)
      setCalories(0)
    }
  }

  function handleCaloriePillClick() {
    setCalorieEditValue(String(calories || ''))
    setCalorieExpanded(true)
  }

  function handleCalorieConfirm() {
    const val = Math.max(0, Math.min(9999, parseInt(calorieEditValue) || 0))
    setCalories(val)
    setCalorieUserEdited(true)
    calorieUserEditedRef.current = true
    setCalorieExpanded(false)
  }

  async function handleSave() {
    if (!userId) {
      setError('No user session found. Please return to onboarding.')
      return
    }
    if (!foodName.trim()) {
      setError('Food name is required.')
      return
    }
    if (calories < 0 || calories > 9999) {
      setError('Please enter a calorie count between 0 and 9999.')
      return
    }

    const usePreview = previewResult !== null && previewedFoodName === foodName.trim()

    setSaving(true)
    setError(null)
    try {
      const imageBase64 = photoFileRef.current ? await fileToBase64(photoFileRef.current) : null
      const entry = await logFood.mutateAsync({
        userId: parseInt(userId, 10),
        foodName: foodName.trim(),
        estimatedCalories: calories,
        source,
        imageBase64,
      })
      setSavedEntryId(entry.id)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      photoFileRef.current = null
      setSavedFoodName(foodName.trim())
      setSaving(false)

      if (usePreview) {
        await applyPreviewResult(entry.id, userId)
      } else {
        await runFullAnalysis(entry.id)
      }
    } catch (err) {
      setSaving(false)
      setError(err instanceof Error ? err.message : 'Failed to save entry.')
    }
  }

  async function applyPreviewResult(entryId: number, uid: string) {
    if (!previewResult) return
    clearPreview()
    const analysisJson = JSON.stringify({
      compatible: previewResult.compatible,
      severity: previewResult.severity,
      educationText: previewResult.educationText,
      alternativeFoodName: previewResult.alternativeFoodName,
      estimatedCalories: previewResult.estimatedCalories,
    })
    await foodLogService.patchAnalysis(entryId, analysisJson)
    const result: FoodAnalysisResult = {
      compatible: previewResult.compatible,
      severity: previewResult.severity,
      educationText: previewResult.educationText ?? '',
      alternativeFoodName: previewResult.alternativeFoodName,
      estimatedCalories: previewResult.estimatedCalories,
    }
    setAnalysisResult(result)
    setAnalysing(false)
    if (!result.compatible && result.alternativeFoodName) {
      const initialAltName = preSaveCurrentAlternativeName ?? result.alternativeFoodName
      setCurrentAlternativeName(initialAltName)
      setShownAlternatives(preSaveShownAlternatives.length > 0 ? preSaveShownAlternatives : [result.alternativeFoodName])
      setSuggestClickCount(preSaveSuggestClickCount)
      setBookmarkSaved(preSaveBookmarkSaved)
      if (preSaveImage) {
        setAlternativeImage(preSaveImage)
      } else if (preSaveImageLoading) {
        setLoadingImage(true)
        preSaveImageAbortRef.current?.abort()
        preSaveImageAbortRef.current = null
        const imgAc = new AbortController()
        imageAbortRef.current = imgAc
        foodLogService.getImageForFoodName(initialAltName, parseInt(uid, 10), imgAc.signal)
          .then(img => {
            if (!imgAc.signal.aborted) {
              setAlternativeImage(img)
              setLoadingImage(false)
            }
          })
          .catch(() => { if (!imgAc.signal.aborted) setLoadingImage(false) })
      }
    }
  }

  async function runFullAnalysis(entryId: number) {
    setAnalysing(true)
    analyseAbortRef.current?.abort()
    const analyseController = new AbortController()
    analyseAbortRef.current = analyseController
    const result = await foodLogService.analyseEntry(entryId, analyseController.signal)
    if (analyseController.signal.aborted) return
    setAnalysing(false)
    if (result) {
      setAnalysisResult(result)
      if (!result.compatible && result.alternativeFoodName) {
        setCurrentAlternativeName(result.alternativeFoodName)
        setShownAlternatives([result.alternativeFoodName])
        setSuggestClickCount(0)
        imageAbortRef.current?.abort()
        const imgController = new AbortController()
        imageAbortRef.current = imgController
        setLoadingImage(true)
        foodLogService.getAlternativeImage(entryId, imgController.signal)
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
  }

  async function handleSuggestAnother() {
    if (!savedEntryId || !userId) return
    suggestAbortRef.current?.abort()
    const controller = new AbortController()
    suggestAbortRef.current = controller
    setSuggestingAlternative(true)
    setBookmarkSaved(false)
    try {
      const suggestion = await foodLogService.suggestAlternative(savedEntryId, shownAlternatives, controller.signal)
      if (controller.signal.aborted || !suggestion?.foodName) return
      const newName = suggestion.foodName
      setCurrentAlternativeName(newName)
      setShownAlternatives(prev => [...prev, newName])
      setSuggestClickCount(prev => prev + 1)
      setAlternativeImage(null)
      setLoadingImage(true)
      imageAbortRef.current?.abort()
      const imgController = new AbortController()
      imageAbortRef.current = imgController
      foodLogService.getImageForFoodName(newName, parseInt(userId, 10), imgController.signal)
        .then(img => {
          if (!imgController.signal.aborted) {
            setAlternativeImage(img)
            setLoadingImage(false)
          }
        })
        .catch(() => {
          if (!imgController.signal.aborted) setLoadingImage(false)
        })
    } catch {
      // silent fallback
    } finally {
      if (!controller.signal.aborted) setSuggestingAlternative(false)
    }
  }

  async function handlePreSaveSuggestAnother() {
    if (!userId || !foodName.trim()) return
    preSaveSuggestAbortRef.current?.abort()
    const controller = new AbortController()
    preSaveSuggestAbortRef.current = controller
    setPreSaveSuggestingAlternative(true)
    setPreSaveBookmarkSaved(false)
    try {
      const suggestion = await foodLogService.suggestAlternativeByName(
        foodName.trim(),
        parseInt(userId, 10),
        preSaveShownAlternatives,
        controller.signal
      )
      if (controller.signal.aborted || !suggestion?.foodName) return
      const newName = suggestion.foodName
      setPreSaveCurrentAlternativeName(newName)
      setPreSaveShownAlternatives(prev => [...prev, newName])
      setPreSaveSuggestClickCount(prev => prev + 1)
      setPreSaveImage(null)
      setPreSaveImageLoading(true)
      preSaveImageAbortRef.current?.abort()
      const imgAc = new AbortController()
      preSaveImageAbortRef.current = imgAc
      foodLogService.getImageForFoodName(newName, parseInt(userId, 10), imgAc.signal)
        .then(img => {
          if (!imgAc.signal.aborted) {
            setPreSaveImage(img)
            setPreSaveImageLoading(false)
          }
        })
        .catch(() => { if (!imgAc.signal.aborted) setPreSaveImageLoading(false) })
    } catch {
      // silent fallback
    } finally {
      if (!controller.signal.aborted) setPreSaveSuggestingAlternative(false)
    }
  }

  async function handleBookmark() {
    if (!userId || !currentAlternativeName) return
    setBookmarkSaving(true)
    try {
      await createBookmark.mutateAsync({
        userId: parseInt(userId, 10),
        alternativeFoodName: currentAlternativeName,
        imageBase64: alternativeImage?.imageBase64 ?? null,
        mimeType: alternativeImage?.mimeType ?? null,
      })
      setBookmarkSaved(true)
    } finally {
      setBookmarkSaving(false)
    }
  }

  async function handlePreSaveBookmark() {
    if (!userId) return
    const altName = preSaveCurrentAlternativeName ?? previewResult?.alternativeFoodName
    if (!altName) return
    setPreSaveBookmarkSaving(true)
    try {
      await createBookmark.mutateAsync({
        userId: parseInt(userId, 10),
        alternativeFoodName: altName,
        imageBase64: preSaveImage?.imageBase64 ?? null,
        mimeType: preSaveImage?.mimeType ?? null,
      })
      setPreSaveBookmarkSaved(true)
    } finally {
      setPreSaveBookmarkSaving(false)
    }
  }

  const showAnalysisPhase = analysing || analysisResult !== null
  const isHighSeverity = analysisResult !== null && !analysisResult.compatible && analysisResult.severity === 'High'
  const previewValid = previewResult !== null && previewedFoodName === foodName.trim()
  const previewIsHighSeverity = previewResult !== null && !previewResult.compatible && previewResult.severity === 'High'

  return {
    previewUrl,
    foodName,
    identifying,
    aiIdentified,
    saving,
    error,
    calories,
    calorieUserEdited,
    calorieExpanded,
    calorieEditValue,
    previewResult,
    previewedFoodName,
    previewLoading,
    previewValid,
    previewIsHighSeverity,
    preSaveImage,
    preSaveImageLoading,
    preSaveCurrentAlternativeName,
    preSaveSuggestClickCount,
    preSaveSuggestingAlternative,
    preSaveBookmarkSaved,
    preSaveBookmarkSaving,
    showAnalysisPhase,
    analysing,
    analysisResult,
    savedFoodName,
    alternativeImage,
    imageLoading,
    isHighSeverity,
    currentAlternativeName,
    suggestClickCount,
    suggestingAlternative,
    bookmarkSaved,
    bookmarkSaving,
    zoomedImageUrl,
    fileInputRef,
    handleFileChange,
    handleRemovePhoto,
    handleFoodNameChange,
    handleCaloriePillClick,
    handleCalorieConfirm,
    handleSave,
    handleSuggestAnother,
    handlePreSaveSuggestAnother,
    handleBookmark,
    handlePreSaveBookmark,
    setZoomedImageUrl,
    setCalorieEditValue,
  }
}

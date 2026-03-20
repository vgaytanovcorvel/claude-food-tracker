import { useState, useEffect, useRef } from 'react'
import { useServices } from '../../../core/providers'
import type { AnalysisPreviewResult } from '../../../domain/models'

interface UseAnalysePreviewOptions {
  foodName: string
  userId: string | null
  immediateRef: React.MutableRefObject<boolean>
}

interface UseAnalysePreviewResult {
  previewResult: AnalysisPreviewResult | null
  previewedFoodName: string
  previewLoading: boolean
  clearPreview: () => void
}

export function useAnalysePreview({
  foodName,
  userId,
  immediateRef,
}: UseAnalysePreviewOptions): UseAnalysePreviewResult {
  const { foodLogService } = useServices()
  const [previewResult, setPreviewResult] = useState<AnalysisPreviewResult | null>(null)
  const [previewedFoodName, setPreviewedFoodName] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  function clearPreview() {
    abortRef.current?.abort()
    setPreviewResult(null)
    setPreviewedFoodName('')
    setPreviewLoading(false)
  }

  useEffect(() => {
    abortRef.current?.abort()
    setPreviewResult(null)
    setPreviewedFoodName('')

    if (!userId || foodName.trim().length < 4) return

    const delay = immediateRef.current ? 0 : 1200
    immediateRef.current = false

    const ac = new AbortController()
    const timer = setTimeout(async () => {
      abortRef.current = ac
      setPreviewLoading(true)
      try {
        const result = await foodLogService.analysePreview(foodName.trim(), parseInt(userId, 10), ac.signal)
        if (ac.signal.aborted || !result) return
        setPreviewResult(result)
        setPreviewedFoodName(foodName.trim())
      } finally {
        if (!ac.signal.aborted) setPreviewLoading(false)
      }
    }, delay)

    return () => {
      clearTimeout(timer)
      ac.abort()
    }
  }, [foodName, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { previewResult, previewedFoodName, previewLoading, clearPreview }
}

import clsx from 'clsx'
import type { AlternativeImageResult } from '../../../../domain/models'
import s from './analysis-card.module.css'

interface AnalysisCardProps {
  compatible: boolean
  severity: string | null
  educationText?: string | null
  alternativeName: string | null
  alternativeImage: AlternativeImageResult | null
  imageLoading: boolean
  suggestClickCount: number
  suggesting: boolean
  bookmarkSaved: boolean
  bookmarkSaving: boolean
  onSuggestAnother: () => void
  onBookmark: () => void
  onImageZoom: (url: string) => void
}

export function AnalysisCard({
  compatible,
  severity,
  educationText,
  alternativeName,
  alternativeImage,
  imageLoading,
  suggestClickCount,
  suggesting,
  bookmarkSaved,
  bookmarkSaving,
  onSuggestAnother,
  onBookmark,
  onImageZoom,
}: AnalysisCardProps) {
  const isHigh = !compatible && severity === 'High'

  return (
    <div className={clsx(s.card, compatible ? s.cardCompatible : isHigh ? s.cardHigh : s.cardWarn)}>
      <div className={s.body}>
        {/* Status row */}
        <div className={s.statusRow}>
          {compatible ? (
            <span className={s.compatibleLabel}>
              <span className={s.compatibleIcon}>✓</span>
              Great choice!
            </span>
          ) : (
            <>
              <span className={clsx(s.severityBadge, isHigh ? s.severityBadgeHigh : s.severityBadgeWarn)}>
                {severity}
              </span>
              <span className={s.conflictLabel}>Diet conflict detected</span>
            </>
          )}
        </div>

        {educationText && (
          <p className={s.educationText}>{educationText}</p>
        )}

        {alternativeName && (
          <div className={s.alternativeRow}>
            {imageLoading && alternativeName !== null && alternativeImage === null && (
              <div className={clsx(s.imageSkeleton, 'animate-pulse')} />
            )}
            {alternativeImage?.imageBase64 && (
              <img
                src={`data:${alternativeImage.mimeType ?? 'image/png'};base64,${alternativeImage.imageBase64}`}
                alt={`Suggested: ${alternativeName}`}
                className={s.alternativeImage}
                onClick={() => onImageZoom(`data:${alternativeImage.mimeType ?? 'image/png'};base64,${alternativeImage.imageBase64}`)}
              />
            )}
            <div className={s.alternativeInfo}>
              <p className={s.tryLabel}>Try instead</p>
              <span className={s.alternativeName}>{alternativeName}</span>
              <div className={s.bookmarkActions}>
                {!bookmarkSaved && (
                  <button
                    onClick={onBookmark}
                    disabled={bookmarkSaving}
                    className={clsx('btn-ghost', s.bookmarkButton, 'text-xs px-2.5 py-1 disabled:opacity-50')}
                  >
                    {bookmarkSaving ? 'Saving…' : 'Save for later'}
                  </button>
                )}
                {bookmarkSaved && <span className={s.bookmarkSavedLabel}>✓ Saved</span>}
              </div>
            </div>
          </div>
        )}

        {!compatible && suggestClickCount < 3 && (
          <button
            onClick={onSuggestAnother}
            disabled={suggesting}
            className={clsx('btn-ghost', s.suggestButton, 'disabled:opacity-50')}
          >
            {suggesting ? 'Finding another option…' : `Suggest another${suggestClickCount > 0 ? ` (${3 - suggestClickCount} left)` : ''}`}
          </button>
        )}
      </div>
    </div>
  )
}

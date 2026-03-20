import type { AlternativeImageResult } from '../../../../domain/models'

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

function cardBackground(compatible: boolean, isHigh: boolean): string {
  if (compatible) return 'rgba(16,185,129,0.06)'
  return isHigh ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)'
}

function cardBorder(compatible: boolean, isHigh: boolean): string {
  if (compatible) return '1px solid rgba(52,211,153,0.35)'
  return isHigh ? '1px solid rgba(239,68,68,0.45)' : '1px solid rgba(251,191,36,0.40)'
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
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: cardBackground(compatible, isHigh),
        border: cardBorder(compatible, isHigh),
      }}
    >
      <div className="px-4 pb-4 space-y-3">
        {/* Status row */}
        <div className="flex items-center gap-2 pt-3">
          {compatible ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
              <span className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center text-[10px]">✓</span>
              Great choice!
            </span>
          ) : (
            <>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0 ${isHigh ? 'bg-red-500' : 'bg-amber-500'}`}>
                {severity}
              </span>
              <span className="text-sm text-glass-text font-medium">Diet conflict detected</span>
            </>
          )}
        </div>

        {educationText && (
          <p className="leading-relaxed" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.88)' }}>
            {educationText}
          </p>
        )}

        {alternativeName && (
          <div className="flex items-start gap-3">
            {imageLoading && alternativeName !== null && alternativeImage === null && (
              <div className="w-20 h-20 rounded-lg bg-white/10 animate-pulse shrink-0" />
            )}
            {alternativeImage?.imageBase64 && (
              <img
                src={`data:${alternativeImage.mimeType ?? 'image/png'};base64,${alternativeImage.imageBase64}`}
                alt={`Suggested: ${alternativeName}`}
                className="w-20 h-20 rounded-lg object-cover shrink-0 cursor-pointer"
                onClick={() => onImageZoom(`data:${alternativeImage.mimeType ?? 'image/png'};base64,${alternativeImage.imageBase64}`)}
              />
            )}
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-glass-muted uppercase tracking-widest" style={{ fontSize: '10px' }}>Try instead</p>
              <span className="font-semibold" style={{ fontSize: '0.9rem', color: 'rgba(56,189,248,0.95)' }}>
                {alternativeName}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                {!bookmarkSaved && (
                  <button
                    onClick={onBookmark}
                    disabled={bookmarkSaving}
                    className="btn-ghost text-xs px-2.5 py-1 disabled:opacity-50"
                    style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    {bookmarkSaving ? 'Saving…' : 'Save for later'}
                  </button>
                )}
                {bookmarkSaved && <span className="text-xs text-emerald-400 font-medium">✓ Saved</span>}
              </div>
            </div>
          </div>
        )}

        {!compatible && suggestClickCount < 3 && (
          <button
            onClick={onSuggestAnother}
            disabled={suggesting}
            className="btn-ghost w-full py-2 text-sm disabled:opacity-50"
            style={{ border: '1px solid rgba(255,255,255,0.15)' }}
          >
            {suggesting ? 'Finding another option…' : `Suggest another${suggestClickCount > 0 ? ` (${3 - suggestClickCount} left)` : ''}`}
          </button>
        )}
      </div>
    </div>
  )
}

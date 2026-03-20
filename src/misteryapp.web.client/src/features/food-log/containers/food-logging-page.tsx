import { useNavigate } from 'react-router-dom'
import { useFoodLoggingForm } from '../state/use-food-logging-form'
import { PhotoCapture } from '../components/photo-capture/photo-capture'
import { FoodNameInput } from '../components/food-name-input/food-name-input'
import { CaloriePill } from '../components/calorie-pill/calorie-pill'
import { AnalysisCard } from '../components/analysis-card/analysis-card'
import { ImageLightbox } from '../components/image-lightbox/image-lightbox'

export default function FoodLoggingPage() {
  const navigate = useNavigate()
  const form = useFoodLoggingForm()

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div
        className="glass-modal modal-sheet w-full max-w-md flex flex-col overflow-hidden"
      >
        <div className="px-6 pt-5 pb-3 shrink-0">
          <h1 className="text-display-md text-white font-bold tracking-tight">Log Food</h1>
        </div>
        <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-2">
          {form.showAnalysisPhase && (
            <div className="space-y-4 pt-1">
              <p className="text-sm text-glass-muted">
                Saved: <span className="text-glass-text font-medium">{form.savedFoodName}</span>
              </p>
              {form.analysing && (
                <div className="space-y-3 animate-pulse" aria-label="Analysing meal">
                  <div className="h-20 bg-white/10 rounded-2xl" />
                  <p className="text-sm text-glass-muted text-center">Analysing your meal…</p>
                </div>
              )}
              {form.analysisResult && (
                <AnalysisCard
                  compatible={form.analysisResult.compatible}
                  severity={form.analysisResult.severity}
                  educationText={form.analysisResult.educationText}
                  alternativeName={form.currentAlternativeName}
                  alternativeImage={form.alternativeImage}
                  imageLoading={form.imageLoading}
                  suggestClickCount={form.suggestClickCount}
                  suggesting={form.suggestingAlternative}
                  bookmarkSaved={form.bookmarkSaved}
                  bookmarkSaving={form.bookmarkSaving}
                  onSuggestAnother={form.handleSuggestAnother}
                  onBookmark={form.handleBookmark}
                  onImageZoom={form.setZoomedImageUrl}
                />
              )}
            </div>
          )}
          {!form.showAnalysisPhase && (
            <>
              <PhotoCapture
                previewUrl={form.previewUrl}
                identifying={form.identifying}
                fileInputRef={form.fileInputRef}
                onFileChange={form.handleFileChange}
                onRemovePhoto={form.handleRemovePhoto}
                onImageZoom={form.setZoomedImageUrl}
              />
              {!form.identifying && (
                <>
                  <FoodNameInput value={form.foodName} aiIdentified={form.aiIdentified} onChange={form.handleFoodNameChange} />
                  <CaloriePill
                    calories={form.calories}
                    calorieUserEdited={form.calorieUserEdited}
                    expanded={form.calorieExpanded}
                    editValue={form.calorieEditValue}
                    onPillClick={form.handleCaloriePillClick}
                    onEditChange={form.setCalorieEditValue}
                    onConfirm={form.handleCalorieConfirm}
                  />
                  {form.previewLoading && (
                    <div className="space-y-2 animate-pulse" aria-label="Analysing diet compatibility">
                      <div className="h-14 bg-white/10 rounded-2xl" />
                      <p className="text-xs text-glass-muted text-center">Checking diet compatibility…</p>
                    </div>
                  )}
                  {!form.previewLoading && form.previewValid && form.previewResult && (
                    <AnalysisCard
                      compatible={form.previewResult.compatible}
                      severity={form.previewResult.severity}
                      educationText={form.previewResult.educationText}
                      alternativeName={form.preSaveCurrentAlternativeName ?? form.previewResult.alternativeFoodName}
                      alternativeImage={form.preSaveImage}
                      imageLoading={form.preSaveImageLoading}
                      suggestClickCount={form.preSaveSuggestClickCount}
                      suggesting={form.preSaveSuggestingAlternative}
                      bookmarkSaved={form.preSaveBookmarkSaved}
                      bookmarkSaving={form.preSaveBookmarkSaving}
                      onSuggestAnother={form.handlePreSaveSuggestAnother}
                      onBookmark={form.handlePreSaveBookmark}
                      onImageZoom={form.setZoomedImageUrl}
                    />
                  )}
                  {form.error && <p className="text-red-400 text-sm">{form.error}</p>}
                </>
              )}
            </>
          )}
        </div>
        <div className="px-6 py-4 shrink-0 border-t border-[var(--color-border-muted)]">
          {form.showAnalysisPhase && form.analysisResult && (
            <button onClick={() => navigate('/')} className="btn-primary w-full py-3">Done</button>
          )}
          {!form.showAnalysisPhase && (
            <div className="flex gap-3">
              <button
                onClick={() => { if (form.previewUrl) URL.revokeObjectURL(form.previewUrl); navigate('/') }}
                className="btn-ghost flex-1 py-3"
              >
                Cancel
              </button>
              <button onClick={form.handleSave} disabled={form.saving || form.identifying} className="btn-primary flex-1 py-3">
                {form.saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>
      {form.zoomedImageUrl && (
        <ImageLightbox imageUrl={form.zoomedImageUrl} onClose={() => form.setZoomedImageUrl(null)} />
      )}
    </div>
  )
}

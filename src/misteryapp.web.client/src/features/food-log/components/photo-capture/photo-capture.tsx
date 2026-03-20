import type React from 'react'

interface PhotoCaptureProps {
  previewUrl: string | null
  identifying: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null> | React.RefObject<HTMLInputElement>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemovePhoto: () => void
  onImageZoom: (url: string) => void
}

export function PhotoCapture({
  previewUrl,
  identifying,
  fileInputRef,
  onFileChange,
  onRemovePhoto,
  onImageZoom,
}: PhotoCaptureProps) {
  return (
    <>
      <div className="relative">
        <div className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-white/20 hover:border-brand-500/50 transition-colors flex items-center justify-center gap-2 text-white/40 hover:text-white/60 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span className="text-sm">{previewUrl ? 'Change photo' : 'Take or upload a photo'}</span>
        </div>
        <input
          ref={fileInputRef as React.RefObject<HTMLInputElement>}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </div>

      {previewUrl && (
        <div className="relative rounded-xl overflow-hidden">
          <img
            src={previewUrl}
            alt="Food preview"
            style={{ maxHeight: '180px', width: '100%', objectFit: 'cover', cursor: 'pointer' }}
            onClick={() => onImageZoom(previewUrl)}
          />
          <button
            onClick={onRemovePhoto}
            className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg hover:bg-black/80 transition"
          >
            Remove
          </button>
        </div>
      )}

      {identifying && (
        <div className="space-y-2 animate-pulse" aria-label="Identifying food">
          <div className="h-4 bg-white/20 rounded w-1/3" />
          <div className="h-10 bg-white/10 rounded-xl" />
          <div className="h-4 bg-white/20 rounded w-1/4 mt-1" />
          <div className="h-10 bg-white/10 rounded-xl" />
          <p className="text-xs text-glass-muted text-center pt-1">Identifying food…</p>
        </div>
      )}
    </>
  )
}

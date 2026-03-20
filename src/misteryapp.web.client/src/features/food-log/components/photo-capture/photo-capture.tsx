import clsx from 'clsx'
import type React from 'react'
import s from './photo-capture.module.css'

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
        <div className={s.dropzone}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span className={s.dropzoneLabel}>{previewUrl ? 'Change photo' : 'Take or upload a photo'}</span>
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
        <div className={s.previewWrap}>
          <img
            src={previewUrl}
            alt="Food preview"
            className={s.previewImage}
            onClick={() => onImageZoom(previewUrl)}
          />
          <button onClick={onRemovePhoto} className={s.removeBtn}>
            Remove
          </button>
        </div>
      )}

      {identifying && (
        <div className={clsx(s.identifyingSkeleton, 'animate-pulse')} aria-label="Identifying food">
          <div className={clsx(s.skeletonLineShort)} />
          <div className={s.skeletonBlock} />
          <div className={clsx(s.skeletonLineQuarter)} />
          <div className={s.skeletonBlock} />
          <p className={s.identifyingCaption}>Identifying food…</p>
        </div>
      )}
    </>
  )
}

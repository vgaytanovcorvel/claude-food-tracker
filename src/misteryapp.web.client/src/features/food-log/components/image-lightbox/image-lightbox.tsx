interface ImageLightboxProps {
  imageUrl: string
  onClose: () => void
}

export function ImageLightbox({ imageUrl, onClose }: ImageLightboxProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={onClose}
    >
      <img
        src={imageUrl}
        alt="Alternative food"
        className="max-w-[88vw] max-h-[80vh] rounded-2xl object-contain"
      />
    </div>
  )
}

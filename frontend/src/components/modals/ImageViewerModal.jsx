import React from 'react'
import { createPortal } from 'react-dom'
import { X, ZoomIn, ExternalLink } from 'lucide-react'

export default function ImageViewerModal({ src, alt = 'Hình ảnh', caption = '', onClose }) {
  if (!src) return null

  const fallbackImage = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80'

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in select-none"
      onClick={onClose}
    >
      {/* Container Box */}
      <div
        className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="brutalist-badge bg-[#ff3e3e] text-white border-2 border-black font-black text-xs px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5">
              <ZoomIn className="w-4 h-4" /> Xem Ảnh Phóng To
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Open Original Image URL */}
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              title="Mở ảnh gốc trong tab mới"
              className="p-2 bg-white text-black border-2 border-black rounded-xl hover:bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center justify-center text-xs font-black"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              title="Đóng xem ảnh (Phím Esc)"
              className="p-2 bg-white text-black border-2 border-black rounded-xl hover:bg-red-50 hover:text-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Image Display */}
        <div className="relative border-4 border-black rounded-2xl overflow-hidden bg-black/40 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] max-h-[75vh] flex items-center justify-center">
          <img
            src={src}
            alt={alt}
            onError={(e) => {
              e.target.onerror = null
              e.target.src = fallbackImage
            }}
            className="max-w-full max-h-[72vh] object-contain rounded-xl"
          />
        </div>

        {/* Caption Bar */}
        {(caption || alt) && (
          <div className="bg-white text-black border-3 border-black rounded-xl px-4 py-2 text-xs sm:text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center max-w-xl truncate">
            {caption || alt}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

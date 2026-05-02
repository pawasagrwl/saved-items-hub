import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxProps {
  images: string[];
  startIndex?: number;
  onClose: () => void;
}

export default function Lightbox({ images, startIndex = 0, onClose }: LightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(() => setIndex(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx > 0) prev();
      else next();
    }
    touchStartX.current = null;
  };

  const multi = images.length > 1;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-fade-in"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar — keeps close button out of image area */}
      <div
        className="shrink-0 h-12 flex items-center justify-end px-3 bg-black/40"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Image area with side controls reserved as columns so buttons never overlap */}
      <div className="flex-1 flex items-stretch min-h-0">
        {multi ? (
          <div className="shrink-0 w-12 sm:w-16 flex items-center justify-center">
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        ) : <div className="shrink-0 w-3 sm:w-6" />}

        <div className="flex-1 flex items-center justify-center min-w-0 px-1">
          <img
            src={images[index]}
            alt=""
            className="max-w-full max-h-full object-contain select-none"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>

        {multi ? (
          <div className="shrink-0 w-12 sm:w-16 flex items-center justify-center">
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        ) : <div className="shrink-0 w-3 sm:w-6" />}
      </div>

      {/* Bottom counter bar — keeps it off the image */}
      <div
        className="shrink-0 h-10 flex items-center justify-center bg-black/40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {multi && (
          <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur text-white text-xs font-mono">
            {index + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
}

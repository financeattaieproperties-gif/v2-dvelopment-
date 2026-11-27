import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, type PanInfo } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './Button';

interface MotionCarouselProps {
  children: ReactNode;
  className?: string;
  slidesPerView?: { base?: number; sm?: number; lg?: number };
  gap?: number;
  autoplayDelay?: number;
  showNavigation?: boolean;
  showPagination?: boolean;
  onSlideChange?: (index: number) => void;
}

export function MotionCarousel({
  children,
  className,
  slidesPerView,
  gap = 24,
  autoplayDelay = 5000,
  showNavigation = true,
  showPagination = true,
  onSlideChange,
}: MotionCarouselProps) {
  const slides = Children.toArray(children);
  const total = slides.length;
  const [index, setIndex] = useState(0);
  const [perView, setPerView] = useState(slidesPerView?.base ?? 1);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePerView = () => {
      const w = window.innerWidth;
      if (w >= 1024 && slidesPerView?.lg) setPerView(slidesPerView.lg);
      else if (w >= 640 && slidesPerView?.sm) setPerView(slidesPerView.sm);
      else setPerView(slidesPerView?.base ?? 1);
    };
    updatePerView();
    window.addEventListener('resize', updatePerView);
    return () => window.removeEventListener('resize', updatePerView);
  }, [slidesPerView?.base, slidesPerView?.lg, slidesPerView?.sm]);

  const maxIndex = Math.max(0, total - Math.floor(perView));
  const clampedIndex = Math.min(index, maxIndex);

  const goTo = (next: number) => {
    const wrapped = next < 0 ? maxIndex : next > maxIndex ? 0 : next;
    setIndex(wrapped);
    onSlideChange?.(wrapped);
  };

  useEffect(() => {
    if (!autoplayDelay || paused || total <= 1) return;
    const id = window.setInterval(() => {
      setIndex((curr) => {
        const next = curr >= maxIndex ? 0 : curr + 1;
        onSlideChange?.(next);
        return next;
      });
    }, autoplayDelay);
    return () => window.clearInterval(id);
  }, [autoplayDelay, maxIndex, onSlideChange, paused, total]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const isRtl = document.documentElement.dir === 'rtl';
    const delta = isRtl ? -info.offset.x : info.offset.x;
    if (delta < -40) {
      setPaused(true);
      goTo(clampedIndex + 1);
    } else if (delta > 40) {
      setPaused(true);
      goTo(clampedIndex - 1);
    }
  };

  if (total === 0) return null;

  const slideWidthPct = 100 / perView;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden select-none', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div
        className="flex cursor-grab active:cursor-grabbing"
        style={{ gap: `${gap}px` }}
        animate={{
          x: `calc(-${clampedIndex * slideWidthPct}% - ${clampedIndex * (gap / perView)}px)`,
        }}
        transition={{ type: 'spring', stiffness: 280, damping: 32, mass: 0.9 }}
        drag={total > 1 ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={handleDragEnd}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            style={{
              flex: `0 0 calc(${slideWidthPct}% - ${((perView - 1) * gap) / perView}px)`,
              minWidth: 0,
            }}
          >
            {slide}
          </div>
        ))}
      </motion.div>

      {showNavigation && total > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => {
              setPaused(true);
              goTo(clampedIndex - 1);
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-brand-navy shadow-md flex items-center justify-center border border-black/10 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => {
              setPaused(true);
              goTo(clampedIndex + 1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-brand-navy shadow-md flex items-center justify-center border border-black/10 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {showPagination && maxIndex > 0 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => {
                setPaused(true);
                goTo(i);
              }}
              className={cn(
                'h-2 rounded-full transition-all',
                i === clampedIndex ? 'w-6 bg-brand-gold' : 'w-2 bg-neutral-300 hover:bg-neutral-400'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

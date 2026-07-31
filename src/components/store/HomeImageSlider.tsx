'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SlideImage {
  image_url: string
  link_url?: string
  title?: string
}

export function HomeImageSlider({ images }: { images: SlideImage[] }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const id = setInterval(() => setActive(i => (i + 1) % images.length), 5000)
    return () => clearInterval(id)
  }, [images.length])

  if (images.length === 0) return null

  const slide = images[active]
  const content = (
    <div className="aspect-[21/9] sm:aspect-[3/1] w-full overflow-hidden rounded-2xl relative bg-[var(--color-mark-muted)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={slide.image_url} alt={slide.title || ''} className="w-full h-full object-cover" />
      {slide.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <p className="text-white font-bold text-lg">{slide.title}</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="container mx-auto px-4 pt-6 relative">
      {slide.link_url ? <a href={slide.link_url}>{content}</a> : content}

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setActive(i => (i - 1 + images.length) % images.length)}
            aria-label="Previous slide"
            className="absolute left-6 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setActive(i => (i + 1) % images.length)}
            aria-label="Next slide"
            className="absolute right-6 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex justify-center gap-1.5 mt-3">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === active ? 'w-6 bg-[var(--accent-primary)]' : 'w-1.5 bg-black/15'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

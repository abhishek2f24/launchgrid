'use client'

import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'

/**
 * Main image + a horizontally scrollable/swipeable thumbnail strip below it.
 * Native `overflow-x-auto` + `scroll-snap` gives real touch-swipe on mobile
 * without a carousel library — tap a thumbnail to also jump the main image.
 */
export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0)
  const current = images[active] ?? images[0]

  return (
    <div className="space-y-4">
      <div className="aspect-[4/5] bg-[var(--color-mark-muted)] border border-[var(--color-mark-default)] overflow-hidden relative">
        {current ? (
          // Merchant/dropship-catalog photos — remote origin, kept as a plain <img> to match this page's existing pattern
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-[var(--color-mark-secondary)]/30" />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {images.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={`shrink-0 w-20 aspect-[4/5] bg-[var(--color-mark-muted)] border overflow-hidden snap-start transition-opacity ${
                i === active ? 'border-[var(--color-mark-ink)] opacity-100' : 'border-[var(--color-mark-default)] opacity-60 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`${title} view ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

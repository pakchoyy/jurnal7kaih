'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

export function PeriodNav({
  label,
  prevHref,
  nextHref,
  children,
}: {
  label: string
  prevHref: string
  nextHref: string | null
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  /** Arah pindah: -1 = mundur (konten masuk dari kiri), +1 = maju (dari kanan). */
  const [dir, setDir] = useState<0 | -1 | 1>(0)
  const startX = useRef<number | null>(null)
  const startY = useRef(0)

  function go(href: string | null, direction: -1 | 1) {
    if (!href) return
    // Tombol TIDAK pernah di-disable: ketuk ulang selalu direspons,
    // navigasi terbaru yang dipakai.
    setDir(direction)
    startTransition(() => {
      router.push(href, { scroll: false })
    })
  }

  return (
    <div
      className="touch-pan-y"
      onTouchStart={(e) => {
        startX.current = e.touches[0].clientX
        startY.current = e.touches[0].clientY
      }}
      onTouchEnd={(e) => {
        if (startX.current === null) return
        const dx = e.changedTouches[0].clientX - startX.current
        const dy = e.changedTouches[0].clientY - startY.current
        startX.current = null
        // Geser mendatar yang jelas saja, supaya scroll ke bawah tidak ikut memicu.
        if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6) return
        if (dx > 0) go(prevHref, -1)
        else go(nextHref, 1)
      }}
    >
      <div className="mb-1.5 flex items-stretch gap-2 rounded-card bg-white p-1.5 shadow-soft">
        <button
          type="button"
          aria-label="Periode sebelumnya"
          onClick={() => go(prevHref, -1)}
          className="flex h-12 flex-1 touch-manipulation select-none items-center justify-center gap-1 rounded-btn border border-line px-3 text-sm font-bold text-ink-2 transition active:scale-95 active:bg-line/60"
        >
          <Icon name="chevron-left" className="h-5 w-5 shrink-0" />
          Mundur
        </button>
        <p
          aria-live="polite"
          className={cn(
            'flex flex-[2] items-center justify-center text-center text-base font-extrabold text-ink transition-opacity',
            isPending && 'opacity-50',
          )}
        >
          {isPending ? 'Memuat…' : label}
        </p>
        {nextHref ? (
          <button
            type="button"
            aria-label="Periode berikutnya"
            onClick={() => go(nextHref, 1)}
            className="flex h-12 flex-1 touch-manipulation select-none items-center justify-center gap-1 rounded-btn border border-line px-3 text-sm font-bold text-ink-2 transition active:scale-95 active:bg-line/60"
          >
            Maju
            <Icon name="chevron-right" className="h-5 w-5 shrink-0" />
          </button>
        ) : (
          <span className="h-12 flex-1" aria-hidden />
        )}
      </div>
      <p className="mb-4 text-center text-xs text-ink-3">
        Ketuk <b>Mundur</b>/<b>Maju</b> atau geser layar ke kiri/kanan untuk pindah periode
      </p>
      <div
        key={`${label}-${dir}`}
        className={cn(
          'transition-opacity',
          isPending && 'opacity-60',
          dir === 0 ? undefined : dir < 0 ? 'slide-from-left' : 'slide-from-right',
        )}
        aria-busy={isPending}
      >
        {children}
      </div>
    </div>
  )
}

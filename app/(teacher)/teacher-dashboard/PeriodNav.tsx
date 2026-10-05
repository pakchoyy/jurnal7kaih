'use client'

import { useEffect, useRef, useTransition } from 'react'
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
  const startX = useRef<number | null>(null)
  const startY = useRef(0)

  // Prefetch periode sebelah sejak tampil, agar ketuk/geser terasa instan.
  useEffect(() => {
    router.prefetch(prevHref)
    if (nextHref) router.prefetch(nextHref)
  }, [router, prevHref, nextHref])

  function go(href: string | null) {
    if (!href) return
    // Tombol TIDAK pernah di-disable: ketuk ulang selalu direspons,
    // navigasi terbaru yang dipakai.
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
        if (dx > 0) go(prevHref)
        else go(nextHref)
      }}
    >
      <div className="mb-1.5 flex items-stretch gap-2 rounded-card bg-white p-1.5 shadow-soft">
        <button
          type="button"
          aria-label="Periode sebelumnya"
          onClick={() => go(prevHref)}
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
            onClick={() => go(nextHref)}
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
      <div className={cn('transition-opacity', isPending && 'opacity-60')} aria-busy={isPending}>
        {children}
      </div>
    </div>
  )
}

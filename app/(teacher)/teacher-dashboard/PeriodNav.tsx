'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icons'

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
  const startX = useRef<number | null>(null)
  const startY = useRef(0)

  return (
    <div
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
        if (dx > 0) router.push(prevHref, { scroll: false })
        else if (nextHref) router.push(nextHref, { scroll: false })
      }}
    >
      <div className="mb-4 flex items-center gap-2 rounded-card bg-white p-1.5 shadow-soft">
        <Link
          href={prevHref}
          scroll={false}
          aria-label="Periode sebelumnya"
          className="pressable flex h-11 w-11 items-center justify-center rounded-btn border border-line text-ink-2"
        >
          <Icon name="chevron-left" className="h-5 w-5" />
        </Link>
        <p className="flex-1 text-center text-base font-bold text-ink">{label}</p>
        {nextHref ? (
          <Link
            href={nextHref}
            scroll={false}
            aria-label="Periode berikutnya"
            className="pressable flex h-11 w-11 items-center justify-center rounded-btn border border-line text-ink-2"
          >
            <Icon name="chevron-right" className="h-5 w-5" />
          </Link>
        ) : (
          <span className="h-11 w-11" />
        )}
      </div>
      {children}
    </div>
  )
}

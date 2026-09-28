'use client'

import { useMemo } from 'react'

const COLORS = ['#F59E0B', '#8B5CF6', '#10B981', '#06B6D4', '#3B82F6', '#EC4899', '#6366F1']

export function Celebration({
  show,
  title,
  message,
  confetti = true,
}: {
  show: boolean
  title: string
  message?: string
  confetti?: boolean
}) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.8 + Math.random() * 1.4,
        size: 6 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
      })),
    [],
  )

  if (!show) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-black/40 px-6"
    >
      {confetti &&
        pieces.map((p, i) => (
          <span
            key={i}
            className="confetti-piece pointer-events-none absolute top-0 block rounded-sm"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 0.5,
              background: p.color,
              transform: `rotate(${p.rotate}deg)`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      <div className="celebrate-pop relative w-full max-w-sm rounded-modal bg-white p-6 text-center shadow-lift">
        <p className="text-5xl">{confetti ? '🎉' : '👍'}</p>
        <p className="mt-3 font-display text-xl font-black text-ink">{title}</p>
        {message && <p className="mt-1 text-base text-ink-2">{message}</p>}
      </div>
    </div>
  )
}

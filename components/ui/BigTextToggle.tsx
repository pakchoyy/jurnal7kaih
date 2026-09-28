'use client'

import { useEffect, useState } from 'react'

export const BIG_TEXT_KEY = 'huruf-besar'

export function BigTextToggle() {
  const [on, setOn] = useState(false)

  useEffect(() => {
    setOn(document.documentElement.classList.contains('big-text'))
  }, [])

  function toggle() {
    const next = !on
    setOn(next)
    document.documentElement.classList.toggle('big-text', next)
    try {
      localStorage.setItem(BIG_TEXT_KEY, next ? '1' : '0')
    } catch {}
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      className="flex w-full items-center gap-3 rounded-card bg-white p-4 text-left shadow-soft"
    >
      <span className="text-2xl">🔠</span>
      <span className="flex-1">
        <span className="block text-base font-bold text-ink">Huruf Besar</span>
        <span className="block text-sm text-ink-3">Perbesar tulisan dan tombol agar mudah dibaca</span>
      </span>
      <span className={`relative h-7 w-12 rounded-full transition ${on ? 'bg-brand-blue' : 'bg-line'}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

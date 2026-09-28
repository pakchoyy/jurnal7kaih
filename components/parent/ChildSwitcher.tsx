'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { pilihAnak } from '@/app/(parent)/anakActions'

export function ChildSwitcher({ items, activeId }: { items: { id: string; name: string }[]; activeId: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  if (items.length < 2) return null

  return (
    <div className={`no-scrollbar -mx-1 mb-3 flex gap-2 overflow-x-auto px-1 ${pending ? 'opacity-60' : ''}`}>
      {items.map((c) => {
        const on = c.id === activeId
        return (
          <button
            key={c.id}
            type="button"
            aria-pressed={on}
            disabled={pending}
            onClick={() =>
              start(async () => {
                await pilihAnak(c.id)
                router.refresh()
              })
            }
            className={`whitespace-nowrap rounded-pill px-4 py-2 text-sm font-bold transition ${
              on ? 'bg-white text-brand-blue' : 'bg-white/15 text-white'
            }`}
          >
            {c.name.split(' ')[0]}
          </button>
        )
      })}
    </div>
  )
}

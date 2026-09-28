'use client'

import { useState } from 'react'
import { CheckboxGroup } from '@/components/forms/CheckboxGroup'
import type { HabitFormProps } from './BangunPagiForm'

const defaultOptions = [
  'Sholat Subuh',
  'Sholat Dzuhur',
  'Sholat Ashar',
  'Sholat Maghrib',
  'Sholat Isya',
  'Mengaji',
  'Berdoa',
]

export function BeribadahForm({ value, onChange }: HabitFormProps) {
  const activities = (value.activities as string[]) ?? []
  const [custom, setCustom] = useState('')

  function setActivities(next: string[]) {
    onChange({ ...value, activities: next })
  }

  return (
    <div className="flex flex-col gap-3">
      <CheckboxGroup
        label="Ibadah yang dilakukan hari ini"
        options={defaultOptions}
        value={activities}
        onChange={setActivities}
      />
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-btn border-[1.5px] border-line bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-3 focus:border-brand-green"
          placeholder="Tambah kegiatan lain…"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
        <button
          type="button"
          className="rounded-btn bg-brand-green px-4 text-sm font-bold text-white"
          onClick={() => {
            if (custom.trim()) {
              setActivities([...activities, custom.trim()])
              setCustom('')
            }
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}

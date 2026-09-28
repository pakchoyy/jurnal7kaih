'use client'

import { useState } from 'react'
import { CheckboxGroup } from '@/components/forms/CheckboxGroup'
import type { HabitFormProps } from './BangunPagiForm'

// Daftar default (Islam). Untuk agama lain, sesuaikan di UI/profil.
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
          className="flex-1 rounded-btn border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
          placeholder="Tambah kegiatan lain…"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
        <button
          type="button"
          className="rounded-btn bg-brand-blue px-3 py-2 text-sm font-semibold text-white"
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

'use client'

import { useState } from 'react'
import { DEFAULT_HABIT_ITEMS, IBADAH_TEMPLATES, MAX_ITEMS_PER_HABIT, MAX_ITEM_LENGTH } from '@/lib/habitItems'
import { habitLight } from '@/lib/utils'
import { simpanItemKebiasaan } from './actions'

interface HabitEdit {
  id: string
  slug: string
  name: string
  icon: string | null
  items: string[]
  isCustom: boolean
}

function HabitCard({ habit }: { habit: HabitEdit }) {
  const [items, setItems] = useState(habit.items)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [dirty, setDirty] = useState(false)

  function change(next: string[]) {
    setItems(next)
    setDirty(true)
    setMsg(null)
  }

  function add() {
    const label = draft.trim()
    if (!label) return
    if (items.some((i) => i.toLowerCase() === label.toLowerCase())) {
      setMsg({ ok: false, text: 'Pilihan itu sudah ada' })
      return
    }
    if (items.length >= MAX_ITEMS_PER_HABIT) {
      setMsg({ ok: false, text: `Maksimal ${MAX_ITEMS_PER_HABIT} pilihan` })
      return
    }
    change([...items, label])
    setDraft('')
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = items.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    change(next)
  }

  async function save(labels = items) {
    setSaving(true)
    const res = await simpanItemKebiasaan(habit.id, labels)
    setSaving(false)
    if (res?.error) return setMsg({ ok: false, text: res.error })
    setDirty(false)
    setMsg({ ok: true, text: 'Tersimpan' })
  }

  async function resetDefault() {
    const defaults = DEFAULT_HABIT_ITEMS[habit.slug] ?? []
    setItems(defaults)
    await save([])
  }

  return (
    <section className="rounded-card bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-2xl"
          style={{ background: habitLight(habit.slug) }}
        >
          {habit.icon}
        </span>
        <h2 className="flex-1 font-display text-base font-extrabold text-ink">{habit.name}</h2>
        <span className="text-sm text-ink-3">{items.length} pilihan</span>
      </div>

      {habit.slug === 'beribadah' && (
        <div className="mb-3">
          <p className="mb-1.5 text-sm font-semibold text-ink-2">Pakai template:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(IBADAH_TEMPLATES).map(([name, list]) => (
              <button
                key={name}
                type="button"
                onClick={() => change(list)}
                className="rounded-pill border-2 border-brand-blue/30 bg-brand-blue-light px-3 py-1.5 text-sm font-semibold text-brand-blue"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="mb-3 flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={item} className="flex items-center gap-1 rounded-btn bg-bg px-3 py-2">
            <span className="flex-1 text-base text-ink">{item}</span>
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label={`Naikkan ${item}`}
              className="h-9 w-9 rounded-lg text-ink-3 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === items.length - 1}
              aria-label={`Turunkan ${item}`}
              className="h-9 w-9 rounded-lg text-ink-3 disabled:opacity-30"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => change(items.filter((x) => x !== item))}
              aria-label={`Hapus ${item}`}
              className="h-9 w-9 rounded-lg text-red-500"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="mb-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          maxLength={MAX_ITEM_LENGTH}
          placeholder="Tambah pilihan baru…"
          aria-label={`Tambah pilihan ${habit.name}`}
          className="min-w-0 flex-1 rounded-btn border-[1.5px] border-line px-3 py-2.5 text-base outline-none focus:border-brand-blue"
        />
        <button type="button" onClick={add} className="rounded-btn bg-brand-blue-light px-4 text-base font-bold text-brand-blue">
          + Tambah
        </button>
      </div>

      {msg && (
        <p className={`mb-2 text-sm font-semibold ${msg.ok ? 'text-emerald-600' : 'text-red-600'}`}>{msg.text}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => save()}
          disabled={saving || !dirty}
          className="flex-1 rounded-btn bg-brand-blue py-3 text-base font-bold text-white disabled:opacity-40"
        >
          {saving ? 'Menyimpan…' : dirty ? 'Simpan' : 'Tersimpan'}
        </button>
        <button type="button" onClick={resetDefault} disabled={saving} className="text-sm font-semibold text-ink-3 underline">
          Pakai bawaan
        </button>
      </div>
    </section>
  )
}

export default function KebiasaanEditor({ habits }: { habits: HabitEdit[] }) {
  return (
    <div className="flex flex-col gap-4">
      {habits.map((h) => (
        <HabitCard key={h.id} habit={h} />
      ))}
    </div>
  )
}

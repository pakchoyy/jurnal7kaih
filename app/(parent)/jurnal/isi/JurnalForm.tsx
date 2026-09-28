'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveJournal } from './actions'
import { Button } from '@/components/ui/Button'
import { habitFormComponents } from '@/components/habits'
import { parseHabitNote } from '@/lib/schemas/habits'

export interface HabitRow {
  id: string
  slug: string
  name: string
  icon: string | null
  color: string | null
}

export interface ExistingEntry {
  habit_id: string
  status: 'done' | 'not_done'
  note: string | null
}

interface Props {
  studentId: string
  studentName: string
  habits: HabitRow[]
  existingEntries: ExistingEntry[]
}

interface EntryState {
  status: 'done' | 'not_done'
  note: Record<string, unknown>
}

export function JurnalForm({ studentId, studentName, habits, existingEntries }: Props) {
  const router = useRouter()

  const initial = useMemo(() => {
    const map: Record<string, EntryState> = {}
    for (const h of habits) {
      const existing = existingEntries.find((e) => e.habit_id === h.id)
      let note: Record<string, unknown> = {}
      if (existing?.note) {
        try {
          note = (parseHabitNote(h.slug, existing.note) as Record<string, unknown>) ?? {}
        } catch {
          note = {}
        }
      }
      map[h.id] = { status: existing?.status ?? 'not_done', note }
    }
    return map
  }, [habits, existingEntries])

  const [entries, setEntries] = useState<Record<string, EntryState>>(initial)
  const [parentNote, setParentNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setStatus(habitId: string, status: 'done' | 'not_done') {
    setEntries((prev) => ({ ...prev, [habitId]: { ...prev[habitId], status } }))
  }

  function setNote(habitId: string, note: Record<string, unknown>) {
    setEntries((prev) => ({ ...prev, [habitId]: { ...prev[habitId], note } }))
  }

  async function handleSave(submit: boolean) {
    setError(null)
    setLoading(true)
    const result = await saveJournal({
      studentId,
      parentNote,
      submit,
      entries: habits.map((h) => ({
        habitId: h.id,
        slug: h.slug,
        status: entries[h.id]?.status ?? 'not_done',
        note: entries[h.id]?.note ?? {},
      })),
    })
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'Gagal menyimpan')
      return
    }
    router.push('/beranda')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-black text-brand-blue">Jurnal {studentName} hari ini</h1>

      {habits.map((h) => {
        const Form = habitFormComponents[h.slug]
        const state = entries[h.id]
        const done = state?.status === 'done'
        return (
          <div
            key={h.id}
            className="rounded-card bg-white p-4 shadow-sm"
            style={{ borderLeft: `4px solid ${h.color ?? '#ccc'}` }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold">
                {h.icon} {h.name}
              </span>
              <button
                type="button"
                onClick={() => setStatus(h.id, done ? 'not_done' : 'done')}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  done ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {done ? 'Selesai ✓' : 'Tandai selesai'}
              </button>
            </div>
            {done && Form && (
              <Form value={state?.note ?? {}} onChange={(v) => setNote(h.id, v)} />
            )}
          </div>
        )
      })}

      <div className="rounded-card bg-white p-4 shadow-sm">
        <label className="mb-1 block text-sm font-medium text-brand-dark">
          Catatan untuk guru (opsional)
        </label>
        <textarea
          className="w-full rounded-btn border border-gray-300 p-3 text-sm outline-none focus:border-brand-blue"
          rows={3}
          value={parentNote}
          onChange={(e) => setParentNote(e.target.value)}
          placeholder="mis. Anak sedang kurang enak badan hari ini"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="ghost"
          className="flex-1 border border-gray-300"
          disabled={loading}
          onClick={() => handleSave(false)}
        >
          Simpan Draft
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={loading}
          onClick={() => handleSave(true)}
        >
          {loading ? 'Menyimpan…' : 'Simpan & Kirim'}
        </Button>
      </div>
    </div>
  )
}

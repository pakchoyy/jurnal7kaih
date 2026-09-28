'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveJournal } from './actions'
import { Button } from '@/components/ui/Button'
import { habitFormComponents } from '@/components/habits'
import { parseHabitNote } from '@/lib/schemas/habits'
import { habitColor, habitLight, todayISO, formatDateID } from '@/lib/utils'

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
  const [open, setOpen] = useState<string | null>(habits[0]?.id ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const doneCount = Object.values(entries).filter((e) => e.status === 'done').length
  const total = habits.length
  const progress = total ? Math.round((doneCount / total) * 100) : 0

  function setStatus(habitId: string, status: 'done' | 'not_done') {
    setEntries((prev) => ({ ...prev, [habitId]: { ...prev[habitId], status } }))
    if (status === 'done') setOpen(habitId)
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
    <div>
      {/* Header gradien hijau ala mockup screen 2 */}
      <header className="relative overflow-hidden bg-grad-green px-5 pb-6 pt-6 text-white">
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
        <p className="text-[11px] font-medium opacity-80">Jurnal hari ini · {studentName}</p>
        <h1 className="font-display text-xl font-black">Isi 7 Kebiasaan</h1>
        <p className="mt-0.5 text-[11px] opacity-75">{formatDateID(todayISO())}</p>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="font-display text-sm font-black">
            {doneCount}/{total}
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-3 px-5 py-5">
        {habits.map((h) => {
          const Form = habitFormComponents[h.slug]
          const state = entries[h.id]
          const done = state?.status === 'done'
          const isOpen = open === h.id
          const color = habitColor(h.slug)

          return (
            <div key={h.id} className="overflow-hidden rounded-card bg-white shadow-soft">
              {/* Baris habit */}
              <button
                type="button"
                onClick={() => {
                  setOpen(isOpen ? null : h.id)
                  if (!done) setStatus(h.id, 'done')
                }}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ background: habitLight(h.slug) }}
                >
                  {h.icon ?? '•'}
                </span>
                <div className="flex-1">
                  <p className="font-display text-sm font-extrabold text-ink">{h.name}</p>
                  <p className="text-[11px] text-ink-3">
                    {done ? 'Sudah diisi' : 'Ketuk untuk isi'}
                  </p>
                </div>
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white transition"
                  style={{ background: done ? color : '#D1D5DB' }}
                >
                  {done ? '✓' : ''}
                </span>
              </button>

              {/* Form habit (accordion) */}
              {done && isOpen && Form && (
                <div className="border-t border-line px-4 py-4">
                  <Form value={state?.note ?? {}} onChange={(v) => setNote(h.id, v)} />
                  <button
                    type="button"
                    onClick={() => setStatus(h.id, 'not_done')}
                    className="mt-2 text-[11px] font-semibold text-ink-3 underline"
                  >
                    Tandai belum dilakukan
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {/* Catatan untuk guru */}
        <div className="rounded-card bg-white p-4 shadow-soft">
          <label className="mb-1.5 block font-display text-[13px] font-extrabold text-ink">
            Catatan untuk guru (opsional)
          </label>
          <textarea
            className="w-full rounded-btn border-[1.5px] border-line p-3 text-sm outline-none placeholder:text-ink-3 focus:border-brand-green focus:ring-2 focus:ring-brand-green/15"
            rows={3}
            value={parentNote}
            onChange={(e) => setParentNote(e.target.value)}
            placeholder="mis. Anak sedang kurang enak badan hari ini"
          />
        </div>

        {error && (
          <p className="rounded-btn bg-red-50 p-3 text-sm font-semibold text-red-500">{error}</p>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            disabled={loading}
            onClick={() => handleSave(false)}
          >
            Simpan Draft
          </Button>
          <Button
            type="button"
            variant="green"
            className="flex-[1.4]"
            disabled={loading}
            onClick={() => handleSave(true)}
          >
            {loading ? 'Menyimpan…' : 'Simpan & Kirim'}
          </Button>
        </div>
      </div>
    </div>
  )
}

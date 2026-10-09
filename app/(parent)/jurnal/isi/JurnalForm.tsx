'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveJournal } from './actions'
import { uploadFoto } from '@/components/journal/photoActions'
import { compressImage } from '@/lib/compressImage'
import { MAX_PHOTOS } from '@/lib/photos'
import { Button } from '@/components/ui/Button'
import { Celebration } from '@/components/ui/Celebration'
import { FloatingHabits } from '@/components/ui/FloatingHabits'
import { habitFormComponents } from '@/components/habits'
import { parseHabitNote } from '@/lib/schemas/habits'
import { cn, habitColor, habitLight, todayISO, shiftISO, formatDateID } from '@/lib/utils'
import { minFillableDate } from '@/lib/journalWindow'

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
  journalDate: string
  journalStatus: 'draft' | 'submitted' | 'reviewed' | null
  habits: HabitRow[]
  habitItems: Record<string, string[]>
  existingEntries: ExistingEntry[]
  initialParentNote: string
  existingPhotoCount: number
}

interface EntryState {
  status: 'done' | 'not_done'
  note: Record<string, unknown>
}

export function JurnalForm({
  studentId,
  studentName,
  journalDate,
  journalStatus,
  habits,
  habitItems,
  existingEntries,
  initialParentNote,
  existingPhotoCount,
}: Props) {
  const router = useRouter()

  const today = todayISO()
  const minDate = minFillableDate(today)
  const canPrev = journalDate > minDate
  const canNext = journalDate < today
  function goDate(d: string) {
    if (d < minDate || d > today || d === journalDate) return
    router.push(d === today ? '/jurnal/isi' : `/jurnal/isi?tanggal=${d}`)
  }

  const initial = useMemo(() => {
    const map: Record<string, EntryState> = {}
    for (const h of habits) {
      const existing = existingEntries.find((e) => e.habit_id === h.id)
      map[h.id] = {
        status: existing?.status ?? 'not_done',
        note: parseHabitNote(h.slug, existing?.note ?? null),
      }
    }
    return map
  }, [habits, existingEntries])

  const [entries, setEntries] = useState<Record<string, EntryState>>(initial)
  const [parentNote, setParentNote] = useState(initialParentNote)
  const [open, setOpen] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [celebrate, setCelebrate] = useState<null | 'full' | 'partial'>(null)
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([])
  const photoSlots = MAX_PHOTOS - existingPhotoCount

  async function addPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, photoSlots - photos.length)
    e.target.value = ''
    const next = await Promise.all(
      files.map(async (f) => {
        const file = await compressImage(f)
        return { file, url: URL.createObjectURL(file) }
      }),
    )
    setPhotos((prev) => [...prev, ...next])
  }

  const doneCount = Object.values(entries).filter((e) => e.status === 'done').length
  const total = habits.length
  const progress = total ? Math.round((doneCount / total) * 100) : 0

  function update(habitId: string, patch: Partial<EntryState>) {
    setEntries((prev) => ({ ...prev, [habitId]: { ...prev[habitId], ...patch } }))
  }

  function toggleDone(habitId: string) {
    const done = entries[habitId]?.status === 'done'
    update(habitId, { status: done ? 'not_done' : 'done' })
  }

  function toggleItem(habitId: string, item: string) {
    const note = entries[habitId]?.note ?? {}
    const items = Array.isArray(note.items) ? (note.items as string[]) : []
    const next = items.includes(item) ? items.filter((i) => i !== item) : [...items, item]
    update(habitId, {
      note: { ...note, items: next },
      ...(next.length > 0 ? { status: 'done' as const } : {}),
    })
  }

  async function handleSave(submit: boolean) {
    setError(null)
    setLoading(true)
    const result = await saveJournal({
      studentId,
      journalDate,
      parentNote,
      submit,
      entries: habits.map((h) => ({
        habitId: h.id,
        slug: h.slug,
        status: entries[h.id]?.status ?? 'not_done',
        note: entries[h.id]?.note ?? {},
      })),
    })
    if (!result.ok) {
      setLoading(false)
      setError(result.error ?? 'Gagal menyimpan')
      return
    }
    for (const p of photos) {
      const fd = new FormData()
      fd.set('foto', p.file)
      const res = await uploadFoto(result.journalId!, fd)
      if (res.error) {
        setLoading(false)
        setError(`Jurnal tersimpan, tapi foto gagal diunggah: ${res.error}`)
        return
      }
    }
    setLoading(false)
    if (submit) {
      setCelebrate(doneCount === total ? 'full' : 'partial')
      setTimeout(() => {
        router.push('/beranda')
        router.refresh()
      }, 2200)
    } else {
      router.push('/beranda')
      router.refresh()
    }
  }

  return (
    <div className="pb-6">
      <header className="relative overflow-hidden bg-grad-green px-5 pb-6 pt-6 text-white">
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
        <FloatingHabits opacity="opacity-20" />
        <p className="text-sm font-medium opacity-90">Jurnal {studentName}</p>
        <h1 className="font-display text-2xl font-black">Isi 7 Kebiasaan</h1>
        <div className="mt-1.5 flex items-center gap-2">
          <button
            type="button"
            aria-label="Hari sebelumnya"
            disabled={!canPrev}
            onClick={() => goDate(shiftISO(journalDate, -1))}
            className="flex h-10 w-10 touch-manipulation select-none items-center justify-center rounded-full bg-white/20 text-xl font-black transition active:scale-90 disabled:opacity-30"
          >
            ‹
          </button>
          <input
            type="date"
            aria-label="Tanggal jurnal"
            value={journalDate}
            min={minDate}
            max={today}
            onChange={(e) => e.target.value && goDate(e.target.value)}
            className="rounded-btn bg-white/20 px-2.5 py-1.5 text-sm font-bold text-white outline-none [color-scheme:dark]"
          />
          <button
            type="button"
            aria-label="Hari berikutnya"
            disabled={!canNext}
            onClick={() => goDate(shiftISO(journalDate, 1))}
            className="flex h-10 w-10 touch-manipulation select-none items-center justify-center rounded-full bg-white/20 text-xl font-black transition active:scale-90 disabled:opacity-30"
          >
            ›
          </button>
          <span className="text-sm opacity-85">{formatDateID(journalDate)}</span>
        </div>
        {journalStatus === 'reviewed' && (
          <p className="mt-2 rounded-btn bg-white/20 px-3 py-2 text-sm font-semibold">
            ✓ Sudah dicek guru. Mengubah akan mengirim ulang untuk dicek lagi.
          </p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/25">
            <div className="bar-grow h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-display text-base font-black">
            {doneCount}/{total}
          </span>
        </div>
        <p className="mt-3 text-sm opacity-90">
          Ketuk <b>lingkaran</b> kalau sudah dilakukan. Ketuk <b>nama kebiasaan</b> untuk pilih detail.
        </p>
      </header>

      <div className="flex flex-col gap-3 px-4 py-4">
        {habits.map((h) => {
          const Form = habitFormComponents[h.slug]
          const state = entries[h.id]
          const done = state?.status === 'done'
          const isOpen = open === h.id
          const color = habitColor(h.slug)
          const options = habitItems[h.id] ?? []
          const picked = Array.isArray(state?.note.items) ? (state.note.items as string[]) : []

          return (
            <div
              key={h.id}
              className="overflow-hidden rounded-card bg-white shadow-soft transition"
              style={{ boxShadow: done ? `inset 4px 0 0 ${color}` : undefined }}
            >
              <div className="flex items-center gap-3 px-3 py-3">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : h.id)}
                  aria-expanded={isOpen}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl"
                    style={{ background: habitLight(h.slug) }}
                  >
                    {h.icon ?? '•'}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-base font-extrabold text-ink">{h.name}</span>
                    <span className="block truncate text-sm text-ink-3">
                      {picked.length > 0 ? picked.join(', ') : done ? 'Sudah ✓' : 'Ketuk untuk pilih detail'}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleDone(h.id)}
                  aria-pressed={done}
                  aria-label={done ? `${h.name}: sudah, ketuk untuk batal` : `Tandai ${h.name} sudah dilakukan`}
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 text-xl font-black text-white transition active:scale-90"
                  style={{ background: done ? color : '#fff', borderColor: done ? color : '#D1D5DB' }}
                >
                  {done ? '✓' : ''}
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-line px-4 pb-4 pt-3">
                  {options.length > 0 && (
                    <>
                      <p className="mb-2 text-sm font-bold text-ink-2">Pilih yang dilakukan hari ini:</p>
                      <div className="mb-3 flex flex-wrap gap-2">
                        {options.map((opt) => {
                          const on = picked.includes(opt)
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => toggleItem(h.id, opt)}
                              aria-pressed={on}
                              className={cn(
                                'rounded-pill border-2 px-3.5 py-2 text-sm font-semibold transition active:scale-95',
                                on ? 'text-white' : 'border-line bg-white text-ink-2',
                              )}
                              style={on ? { background: color, borderColor: color } : undefined}
                            >
                              {on ? '✓ ' : ''}
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}

                  {Form && (
                    <div className="mb-3">
                      <Form
                        value={state?.note ?? {}}
                        onChange={(v) => update(h.id, { note: v, status: 'done' })}
                      />
                    </div>
                  )}

                  <label className="mb-1 block text-sm font-bold text-ink-2" htmlFor={`catatan-${h.id}`}>
                    Catatan (boleh kosong)
                  </label>
                  <input
                    id={`catatan-${h.id}`}
                    maxLength={300}
                    value={(state?.note.catatan as string) ?? ''}
                    onChange={(e) => update(h.id, { note: { ...state.note, catatan: e.target.value } })}
                    placeholder="Cerita singkat…"
                    className="w-full rounded-btn border-[1.5px] border-line px-3.5 py-3 text-base outline-none focus:border-brand-green"
                  />
                </div>
              )}
            </div>
          )
        })}

        {photoSlots > 0 && (
          <div className="rounded-card bg-white p-4 shadow-soft">
            <p className="mb-1 font-display text-base font-extrabold text-ink">📷 Foto kegiatan (boleh kosong)</p>
            <p className="mb-3 text-sm text-ink-3">Maksimal {MAX_PHOTOS} foto per hari. Hanya guru kelas yang bisa melihat.</p>
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={p.url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={`Foto ${i + 1}`} className="h-20 w-20 rounded-btn object-cover" />
                  <button
                    type="button"
                    aria-label="Hapus foto"
                    onClick={() => setPhotos((prev) => prev.filter((x) => x !== p))}
                    className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-xs text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {photos.length < photoSlots && (
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-btn border-2 border-dashed border-line text-ink-3">
                  <span className="text-2xl">＋</span>
                  <span className="text-xs">Foto</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} />
                </label>
              )}
            </div>
          </div>
        )}

        <div className="rounded-card bg-white p-4 shadow-soft">
          <label htmlFor="parent-note" className="mb-1.5 block font-display text-base font-extrabold text-ink">
            Pesan untuk guru (boleh kosong)
          </label>
          <textarea
            id="parent-note"
            className="w-full rounded-btn border-[1.5px] border-line p-3 text-base outline-none placeholder:text-ink-3 focus:border-brand-green focus:ring-2 focus:ring-brand-green/15"
            rows={3}
            maxLength={1000}
            value={parentNote}
            onChange={(e) => setParentNote(e.target.value)}
            placeholder="mis. Anak sedang kurang enak badan hari ini"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-btn bg-red-50 p-3 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}

        <Button type="button" variant="green" size="lg" block disabled={loading} onClick={() => handleSave(true)}>
          {loading ? 'Menyimpan…' : 'Kirim ke Guru'}
        </Button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSave(false)}
          className="py-2 text-sm font-semibold text-ink-3 underline"
        >
          Simpan dulu, kirim nanti
        </button>
      </div>

      <Celebration
        show={celebrate !== null}
        confetti={celebrate === 'full'}
        title={celebrate === 'full' ? `Hebat, ${studentName.split(' ')[0]}!` : 'Jurnal terkirim'}
        message={
          celebrate === 'full'
            ? 'Semua 7 kebiasaan selesai hari ini. Pertahankan ya!'
            : `${doneCount} dari ${total} kebiasaan. Besok pasti bisa lebih!`
        }
      />
    </div>
  )
}

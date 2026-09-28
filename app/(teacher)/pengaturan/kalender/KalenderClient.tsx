'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import { formatDateID } from '@/lib/utils'
import type { Holiday } from '@/lib/schoolCalendar'
import { hapusLibur, simpanHariSekolah, tambahLibur, type HolidayState } from './actions'

function AddButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="rounded-btn bg-brand-blue py-3 text-base font-bold text-white disabled:opacity-50">
      {pending ? 'Menyimpan…' : '+ Tambah Libur'}
    </button>
  )
}

export default function KalenderClient({
  days,
  holidays,
  today,
}: {
  days: '1-5' | '1-6'
  holidays: Holiday[]
  today: string
}) {
  const router = useRouter()
  const [current, setCurrent] = useState(days)
  const [pending, start] = useTransition()
  const [state, action] = useFormState<HolidayState, FormData>(tambahLibur, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) formRef.current?.reset()
  }, [state?.ok])

  const inputCls = 'w-full rounded-btn border border-line px-3 py-3 text-base focus:border-brand-blue focus:outline-none'

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-card bg-white p-4 shadow-soft">
        <p className="mb-3 text-base font-bold text-ink">Hari sekolah</p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['1-5', 'Senin – Jumat', '5 hari'],
              ['1-6', 'Senin – Sabtu', '6 hari'],
            ] as const
          ).map(([v, label, sub]) => (
            <button
              key={v}
              type="button"
              disabled={pending}
              aria-pressed={current === v}
              onClick={() =>
                start(async () => {
                  setCurrent(v)
                  await simpanHariSekolah(v)
                  router.refresh()
                })
              }
              className={`rounded-btn border-2 p-3 text-left transition ${
                current === v ? 'border-brand-blue bg-brand-blue-light' : 'border-line bg-white'
              }`}
            >
              <span className="block text-base font-bold text-ink">{label}</span>
              <span className="block text-sm text-ink-3">{sub} sekolah</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-card bg-white p-4 shadow-soft">
        <p className="mb-3 text-base font-bold text-ink">Tambah tanggal libur</p>
        <form ref={formRef} action={action} className="flex flex-col gap-3">
          <input name="name" required maxLength={80} placeholder="mis. Libur Maulid Nabi, Libur Semester" className={inputCls} aria-label="Nama libur" />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm text-ink-2">
              Mulai
              <input name="start" type="date" required min="2020-01-01" defaultValue={today} className={inputCls} />
            </label>
            <label className="text-sm text-ink-2">
              Sampai <span className="text-ink-3">(boleh kosong)</span>
              <input name="end" type="date" min="2020-01-01" className={inputCls} />
            </label>
          </div>
          {state?.error && <p className="text-sm font-semibold text-red-600">{state.error}</p>}
          <AddButton />
        </form>
      </section>

      <section>
        <p className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink-2">Daftar libur</p>
        {holidays.length === 0 ? (
          <p className="rounded-card bg-white p-4 text-sm text-ink-3 shadow-soft">Belum ada tanggal libur.</p>
        ) : (
          <ul className="stagger flex flex-col gap-2">
            {holidays.map((h) => {
              const past = h.end_date < today
              return (
                <li key={h.id} className={`flex items-center gap-3 rounded-[12px] bg-white px-4 py-3 shadow-row ${past ? 'opacity-50' : ''}`}>
                  <span className="text-2xl">🏖️</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-ink">{h.name}</p>
                    <p className="text-sm text-ink-3">
                      {formatDateID(h.start_date)}
                      {h.end_date !== h.start_date && ` – ${formatDateID(h.end_date)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    aria-label={`Hapus ${h.name}`}
                    onClick={() => {
                      if (!confirm(`Hapus libur "${h.name}"?`)) return
                      start(async () => {
                        await hapusLibur(h.id!)
                        router.refresh()
                      })
                    }}
                    className="h-10 w-10 rounded-lg text-red-500"
                  >
                    ✕
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

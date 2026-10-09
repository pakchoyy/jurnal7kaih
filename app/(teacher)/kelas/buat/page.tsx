'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { buatKelas, type FormState } from './actions'

const inputCls =
  'w-full rounded-btn border border-line px-3 py-3 text-base focus:border-brand-blue focus:outline-none'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-btn bg-brand-blue py-3.5 text-base font-bold text-white transition hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Menyimpan…' : 'Buat Kelas'}
    </button>
  )
}

export default function BuatKelasPage() {
  const [state, action] = useFormState<FormState, FormData>(buatKelas, null)

  return (
    <div className="px-5 py-5">
      <div className="mb-5 flex items-center gap-3">
        <Link prefetch={false} href="/kelas" className="py-2 text-sm font-semibold text-brand-blue">← Kembali</Link>
        <h1 className="font-display text-lg font-black text-ink">Buat Kelas Baru</h1>
      </div>

      <form action={action} className="flex flex-col gap-4 rounded-card bg-white p-5 shadow-soft">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-semibold text-ink">Nama Kelas</label>
          <input id="name" name="name" required maxLength={30} placeholder="mis. 1A, 4B, 7C" className={inputCls} />
          <p className="mt-1 text-xs text-ink-3">Tulis singkat, contoh: 1A atau 7 Merah</p>
        </div>

        <div>
          <label htmlFor="grade" className="mb-1 block text-sm font-semibold text-ink">Tingkat</label>
          <select id="grade" name="grade" defaultValue="1" className={inputCls}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                Kelas {g} {g <= 6 ? '(SD)' : g <= 9 ? '(SMP)' : '(SMA/SMK)'}
              </option>
            ))}
          </select>
        </div>

        {state?.error && (
          <p role="alert" className="rounded-btn bg-red-50 p-3 text-sm font-semibold text-red-600">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>
    </div>
  )
}

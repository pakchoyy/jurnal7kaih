'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { ubahKelas, type FormState } from './actions'

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
      {pending ? 'Menyimpan…' : 'Simpan Perubahan'}
    </button>
  )
}

export default function EditKelasForm({
  classId,
  initialName,
  initialGrade,
}: {
  classId: string
  initialName: string
  initialGrade: number
}) {
  const [state, action] = useFormState<FormState, FormData>(ubahKelas, null)

  return (
    <form action={action} className="flex flex-col gap-4 rounded-card bg-white p-5 shadow-soft">
      <input type="hidden" name="classId" value={classId} />

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-semibold text-ink">Nama Kelas</label>
        <input
          id="name"
          name="name"
          required
          maxLength={30}
          defaultValue={initialName}
          placeholder="mis. 1A, 4B, 7C"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="grade" className="mb-1 block text-sm font-semibold text-ink">Tingkat</label>
        <select id="grade" name="grade" defaultValue={String(initialGrade)} className={inputCls}>
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
      <Link prefetch={false}
        href={`/kelas/${classId}`}
        className="py-1 text-center text-sm font-semibold text-ink-3"
      >
        Batal
      </Link>
    </form>
  )
}

'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { tambahSiswa, type FormState } from './actions'

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
      {pending ? 'Menyimpan…' : 'Simpan Siswa'}
    </button>
  )
}

export default function TambahSiswaForm({ classId }: { classId: string }) {
  const [state, action] = useFormState<FormState, FormData>(tambahSiswa.bind(null, classId), null)

  return (
    <form action={action} className="flex flex-col gap-4 rounded-card bg-white p-5 shadow-soft">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-semibold text-ink">Nama Lengkap</label>
        <input id="name" name="name" required placeholder="Nama siswa" className={inputCls} />
      </div>

      <div>
        <label htmlFor="nis" className="mb-1 block text-sm font-semibold text-ink">NIS</label>
        <input
          id="nis"
          name="nis"
          required
          inputMode="numeric"
          autoComplete="off"
          placeholder="Nomor Induk Siswa"
          className={inputCls}
        />
        <p className="mt-1 text-xs text-ink-3">
          Orang tua login cukup dengan NIS ini.
        </p>
      </div>

      <div>
        <label htmlFor="nisn" className="mb-1 block text-sm font-semibold text-ink">
          NISN <span className="font-normal text-ink-3">(boleh kosong)</span>
        </label>
        <input id="nisn" name="nisn" inputMode="numeric" placeholder="Nomor Induk Siswa Nasional" className={inputCls} />
      </div>

      <div>
        <label htmlFor="gender" className="mb-1 block text-sm font-semibold text-ink">Jenis Kelamin</label>
        <select id="gender" name="gender" className={inputCls}>
          <option value="">— Pilih —</option>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-btn bg-red-50 p-3 text-sm font-semibold text-red-600">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}

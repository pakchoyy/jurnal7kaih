'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { pindahkanSiswa, type MoveState } from './actions'

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-btn bg-brand-blue py-3.5 text-base font-bold text-white disabled:opacity-50"
    >
      {pending ? 'Memproses…' : label}
    </button>
  )
}

export default function NaikKelasForm({
  classId,
  nextGrade,
  students,
  targets,
}: {
  classId: string
  nextGrade: number
  students: { id: string; name: string; student_number: string | null }[]
  targets: { id: string; label: string; active: boolean }[]
}) {
  const [state, action] = useFormState<MoveState, FormData>(pindahkanSiswa.bind(null, classId), null)
  const [target, setTarget] = useState('baru')
  const [checked, setChecked] = useState<Set<string>>(new Set(students.map((s) => s.id)))

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const inputCls = 'w-full rounded-btn border border-line px-3 py-3 text-base focus:border-brand-blue focus:outline-none'

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (target === 'lulus' && !confirm(`Tandai ${checked.size} siswa lulus/keluar? Mereka tidak tampil lagi di kelas.`)) {
          e.preventDefault()
        }
      }}
      className="flex flex-col gap-4"
    >
      <div className="rounded-card bg-white p-4 shadow-soft">
        <p className="mb-2 text-base font-bold text-ink">1. Tujuan</p>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-base">
            <input type="radio" name="target" value="baru" checked={target === 'baru'} onChange={() => setTarget('baru')} />
            Buat kelas baru
          </label>
          {target === 'baru' && (
            <div className="ml-6 grid grid-cols-2 gap-2">
              <input name="newName" placeholder="mis. 8A" maxLength={30} className={inputCls} aria-label="Nama kelas baru" />
              <select name="newGrade" defaultValue={nextGrade} className={inputCls} aria-label="Tingkat">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>
                    Kelas {g}
                  </option>
                ))}
              </select>
            </div>
          )}
          {targets.map((t) => (
            <label key={t.id} className="flex items-center gap-2 text-base">
              <input type="radio" name="target" value={t.id} checked={target === t.id} onChange={() => setTarget(t.id)} />
              {t.label}
            </label>
          ))}
          <label className="flex items-center gap-2 text-base text-red-700">
            <input type="radio" name="target" value="lulus" checked={target === 'lulus'} onChange={() => setTarget('lulus')} />
            Lulus / keluar sekolah
          </label>
        </div>
        <p className="mt-2 text-sm text-ink-3">Kelas baru dibuat di tahun ajaran yang sedang aktif (atur di Pengaturan).</p>
      </div>

      <div className="rounded-card bg-white p-4 shadow-soft">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-base font-bold text-ink">
            2. Siswa ({checked.size}/{students.length})
          </p>
          <button
            type="button"
            onClick={() => setChecked(checked.size === students.length ? new Set() : new Set(students.map((s) => s.id)))}
            className="text-sm font-semibold text-brand-blue"
          >
            {checked.size === students.length ? 'Kosongkan' : 'Pilih semua'}
          </button>
        </div>
        <ul className="flex flex-col">
          {students.map((s) => (
            <li key={s.id}>
              <label className="flex items-center gap-3 border-b border-line py-2.5 text-base last:border-0">
                <input type="checkbox" name="student" value={s.id} checked={checked.has(s.id)} onChange={() => toggle(s.id)} className="h-5 w-5" />
                <span className="flex-1">{s.name}</span>
                <span className="text-sm text-ink-3">{s.student_number}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-btn bg-red-50 p-3 text-sm font-semibold text-red-600">
          {state.error}
        </p>
      )}
      <Submit label={target === 'lulus' ? 'Tandai Lulus' : `Pindahkan ${checked.size} Siswa`} />
    </form>
  )
}

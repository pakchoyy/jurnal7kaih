'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateActivationCodeAction } from './actions'
import { Button } from '@/components/ui/Button'

interface StudentOption {
  id: string
  name: string
  class_name: string | null
}

interface CodeRow {
  id: string
  code: string
  student_name: string
  used_at: string | null
  expires_at: string
}

export function KodeAktivasiClient({
  students,
  codes,
}: {
  students: StudentOption[]
  codes: CodeRow[]
}) {
  const router = useRouter()
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    if (!selectedStudent) return
    setError(null)
    setGeneratedCode(null)
    setCopied(false)
    setLoading(true)
    const res = await generateActivationCodeAction(selectedStudent)
    setLoading(false)

    if (!res.ok) {
      setError(res.error ?? 'Gagal membuat kode')
      return
    }
    setGeneratedCode(res.code!)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-card bg-white p-4 shadow-soft">
        <h2 className="mb-3 font-display text-sm font-extrabold text-ink">Generate Kode Baru</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block font-display text-[13px] font-extrabold text-ink">
              Pilih Siswa
            </label>
            <select
              className="w-full rounded-btn border-[1.5px] border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-blue"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.class_name ?? 'Tanpa kelas'})
                </option>
              ))}
            </select>
          </div>
          <Button type="button" disabled={loading || !selectedStudent} onClick={handleGenerate}>
            {loading ? 'Membuat…' : 'Generate Kode'}
          </Button>
        </div>

        {error && <p className="mt-2 text-sm font-semibold text-red-500">{error}</p>}

        {generatedCode && (
          <div className="mt-3 rounded-card border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-[11px] text-emerald-700">Kode Aktivasi Berhasil Dibuat</p>
            <p className="my-2 font-display text-3xl font-black tracking-[.35em] text-emerald-600">
              {generatedCode}
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(generatedCode)
                setCopied(true)
              }}
              className="rounded-btn bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white"
            >
              {copied ? 'Tersalin ✓' : 'Salin Kode'}
            </button>
          </div>
        )}
        {students.length === 0 && (
          <p className="mt-2 text-xs text-ink-3">
            Tambahkan siswa terlebih dahulu di menu Siswa.
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-sm font-extrabold text-ink">Daftar Kode Aktivasi</h2>
        {codes.length === 0 ? (
          <div className="rounded-card bg-white p-5 text-center text-sm text-ink-3 shadow-soft">
            Belum ada kode aktivasi.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {codes.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-[12px] bg-white px-4 py-3 shadow-row"
              >
                <div>
                  <p className="font-mono font-display text-sm font-black tracking-widest text-ink">
                    {c.code}
                  </p>
                  <p className="text-[11px] text-ink-3">
                    {c.student_name} · exp {c.expires_at.slice(0, 10)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    c.used_at ? 'bg-gray-100 text-ink-3' : 'bg-brand-blue/15 text-brand-blue'
                  }`}
                >
                  {c.used_at ? 'Dipakai' : 'Aktif'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

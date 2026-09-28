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

  async function handleGenerate() {
    if (!selectedStudent) return
    setError(null)
    setGeneratedCode(null)
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
    <div className="flex flex-col gap-6">
      <div className="rounded-card bg-white p-4 shadow-sm">
        <h2 className="font-bold text-gray-700">Generate Kode Baru</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-brand-dark">Pilih Siswa</label>
            <select
              className="w-full rounded-btn border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
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

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {generatedCode && (
          <div className="mt-3 rounded-btn bg-brand-green/10 p-3 text-center">
            <p className="text-xs text-gray-500">Kode Berhasil Dibuat:</p>
            <p className="text-2xl font-black text-brand-green tracking-widest">{generatedCode}</p>
          </div>
        )}
      </div>

      <div className="rounded-card bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bold text-gray-700">Daftar Kode Aktivasi</h2>
        {codes.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada kode aktivasi yang dibuat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 text-left text-xs text-gray-400">
                <tr>
                  <th className="px-3 py-2">Kode</th>
                  <th className="px-3 py-2">Siswa</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Kedaluwarsa</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50">
                    <td className="px-3 py-2 font-mono font-bold">{c.code}</td>
                    <td className="px-3 py-2 text-gray-600">{c.student_name}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          c.used_at
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-brand-blue/15 text-brand-blue'
                        }`}
                      >
                        {c.used_at ? 'Sudah dipakai' : 'Belum dipakai'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-400">
                      {c.expires_at.slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

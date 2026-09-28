'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addTeacherNote } from './actions'
import { Button } from '@/components/ui/Button'

export function NoteForm({
  studentId,
  journalId,
}: {
  studentId: string
  journalId: string | null
}) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="rounded-card bg-white p-4 shadow-sm">
      <label className="mb-1 block text-sm font-medium text-brand-dark">Tambah catatan</label>
      <textarea
        className="w-full rounded-btn border border-gray-300 p-3 text-sm outline-none focus:border-brand-blue"
        rows={3}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Catatan untuk siswa/orang tua…"
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      <Button
        type="button"
        className="mt-2 w-full"
        disabled={loading}
        onClick={async () => {
          setError(null)
          setLoading(true)
          const res = await addTeacherNote(studentId, journalId, note)
          setLoading(false)
          if (!res.ok) {
            setError(res.error ?? 'Gagal menyimpan')
            return
          }
          setNote('')
          router.refresh()
        }}
      >
        {loading ? 'Menyimpan…' : 'Simpan Catatan'}
      </Button>
    </div>
  )
}

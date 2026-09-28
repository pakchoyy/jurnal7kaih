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
    <div className="rounded-card bg-white p-4 shadow-soft">
      <textarea
        className="w-full rounded-btn border-[1.5px] border-line p-3 text-sm outline-none placeholder:text-ink-3 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
        rows={3}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Catatan untuk siswa/orang tua…"
      />
      {error && <p className="mt-1 text-sm font-semibold text-red-500">{error}</p>}
      <Button
        type="button"
        block
        className="mt-2"
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

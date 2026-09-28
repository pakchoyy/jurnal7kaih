import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { NoteForm } from './NoteForm'

export default async function TeacherStudentDetail({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { data: student } = await supabase
    .from('students')
    .select('id, name')
    .eq('id', params.id)
    .single()

  if (!student) {
    return (
      <div className="px-5 py-6">
        <p className="text-gray-500">Siswa tidak ditemukan.</p>
        <Link href="/teacher-dashboard" className="text-brand-blue">
          ← Kembali
        </Link>
      </div>
    )
  }

  const { data: journals } = await supabase
    .from('journals')
    .select('id, journal_date, status')
    .eq('student_id', student.id)
    .order('journal_date', { ascending: false })
    .limit(10)

  const { data: notes } = await supabase
    .from('teacher_notes')
    .select('id, note, created_at')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  const latestJournalId = journals?.[0]?.id ?? null

  return (
    <div className="px-5 py-6">
      <Link href="/teacher-dashboard" className="text-sm text-brand-blue">
        ← Kembali
      </Link>
      <h1 className="mt-2 text-2xl font-black text-brand-blue">{student.name}</h1>

      <h2 className="mt-5 mb-2 font-bold text-gray-700">Jurnal terakhir</h2>
      <ul className="flex flex-col gap-2">
        {(journals ?? []).map((j) => (
          <li
            key={j.id}
            className="flex items-center justify-between rounded-card bg-white p-3 text-sm shadow-sm"
          >
            <span>{j.journal_date}</span>
            <span className="text-gray-400">{j.status}</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-5 mb-2 font-bold text-gray-700">Catatan saya</h2>
      <NoteForm studentId={student.id} journalId={latestJournalId} />

      <ul className="mt-3 flex flex-col gap-2">
        {(notes ?? []).map((n) => (
          <li key={n.id} className="rounded-card bg-brand-blue/5 p-3 text-sm">
            {n.note}
            <span className="mt-1 block text-xs text-gray-400">{n.created_at.slice(0, 10)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

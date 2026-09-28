import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { parseHabitNote } from '@/lib/schemas/habits'

export default async function JurnalDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { data: journal } = await supabase
    .from('journals')
    .select('id, journal_date, status, parent_note, student_id, students(name)')
    .eq('id', params.id)
    .single()

  if (!journal) {
    return (
      <div className="px-5 py-6">
        <p className="text-gray-500">Jurnal tidak ditemukan.</p>
        <Link href="/jurnal" className="text-brand-blue">
          ← Kembali
        </Link>
      </div>
    )
  }

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id, status, note, habit_id, habits(name, slug, icon, color)')
    .eq('journal_id', journal.id)

  const { data: notes } = await supabase
    .from('teacher_notes')
    .select('id, note, created_at, users(name)')
    .eq('journal_id', journal.id)
    .order('created_at', { ascending: false })

  const studentName = (journal.students as unknown as { name: string } | null)?.name ?? 'Siswa'

  return (
    <div className="px-5 py-6">
      <Link href="/jurnal" className="text-sm text-brand-blue">
        ← Kembali
      </Link>
      <h1 className="mt-2 text-2xl font-black text-brand-blue">{studentName}</h1>
      <p className="text-gray-500">{journal.journal_date}</p>

      <ul className="mt-5 flex flex-col gap-3">
        {(entries ?? []).map((e: any) => {
          const habit = e.habits as unknown as {
            name: string
            slug: string
            icon: string
            color: string
          } | null
          let noteText = ''
          if (habit && e.note) {
            try {
              noteText = JSON.stringify(parseHabitNote(habit.slug, e.note))
            } catch {
              noteText = e.note
            }
          }
          return (
            <li
              key={e.id}
              className="rounded-card bg-white p-4 shadow-sm"
              style={{ borderLeft: `4px solid ${habit?.color ?? '#ccc'}` }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {habit?.icon} {habit?.name}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    e.status === 'done' ? 'text-brand-green' : 'text-gray-400'
                  }`}
                >
                  {e.status === 'done' ? 'Selesai' : 'Belum'}
                </span>
              </div>
              {noteText && <p className="mt-1 break-words text-sm text-gray-500">{noteText}</p>}
            </li>
          )
        })}
      </ul>

      {notes && notes.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-bold text-gray-700">Catatan Guru</h2>
          <ul className="flex flex-col gap-2">
            {notes.map((n: any) => (
              <li key={n.id} className="rounded-card bg-brand-blue/5 p-3">
                <p className="text-sm">{n.note}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {(n.users as unknown as { name: string } | null)?.name ?? 'Guru'} ·{' '}
                  {n.created_at.slice(0, 10)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

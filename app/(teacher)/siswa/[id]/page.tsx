import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { NoteForm } from './NoteForm'
import { initials, formatDateID, habitColor, habitLight } from '@/lib/utils'

export default async function TeacherStudentDetail({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { data: student } = await supabase
    .from('students')
    .select('id, name')
    .eq('id', params.id)
    .single()

  if (!student) {
    return (
      <div className="px-5 py-8">
        <p className="text-ink-2">Siswa tidak ditemukan.</p>
        <Link href="/teacher-dashboard" className="text-sm font-semibold text-brand-blue">
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

  const latestJournal = journals?.[0]
  const latestJournalId = latestJournal?.id ?? null

  // Entries jurnal terakhir untuk menampilkan 7 kebiasaan
  const { data: entries } = latestJournalId
    ? await supabase
        .from('journal_entries')
        .select('status, habits(slug, name, icon)')
        .eq('journal_id', latestJournalId)
    : { data: [] }

  const { data: notes } = await supabase
    .from('teacher_notes')
    .select('id, note, created_at')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white/90 px-5 py-3.5 backdrop-blur">
        <Link href="/teacher-dashboard" className="text-xl text-ink-3">
          ←
        </Link>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">
          {initials(student.name)}
        </span>
        <div>
          <h1 className="text-base font-black text-brand-blue">{student.name}</h1>
          <p className="text-[11px] text-ink-3">
            {latestJournal ? `Jurnal terakhir ${formatDateID(latestJournal.journal_date)}` : 'Belum ada jurnal'}
          </p>
        </div>
      </header>

      <div className="px-5 py-5">
        {/* Kebiasaan jurnal terakhir */}
        {entries && entries.length > 0 && (
          <>
            <p className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
              Kebiasaan Terakhir
            </p>
            <div className="mb-5 grid grid-cols-2 gap-2">
              {(entries as any[]).map((e, i) => {
                const h = e.habits as unknown as { slug: string; name: string; icon: string } | null
                const done = e.status === 'done'
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-[12px] bg-white px-3 py-2.5 shadow-row"
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
                      style={{ background: habitLight(h?.slug ?? '') }}
                    >
                      {h?.icon ?? '•'}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-ink">
                      {h?.name}
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: done ? habitColor(h?.slug ?? '') : '#D1D5DB' }}
                    >
                      {done ? '✓' : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Riwayat jurnal */}
        <p className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
          Riwayat Jurnal
        </p>
        <ul className="mb-5 flex flex-col gap-2">
          {(journals ?? []).map((j) => (
            <li
              key={j.id}
              className="flex items-center justify-between rounded-[12px] bg-white px-4 py-3 text-sm shadow-row"
            >
              <span className="font-semibold">{formatDateID(j.journal_date)}</span>
              <span className="text-xs text-ink-3">{j.status}</span>
            </li>
          ))}
        </ul>

        {/* Form catatan */}
        <p className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
          Catatan Guru
        </p>
        <NoteForm studentId={student.id} journalId={latestJournalId} />

        <ul className="mt-3 flex flex-col gap-2">
          {(notes ?? []).map((n) => (
            <li key={n.id} className="rounded-card border border-brand-blue/15 bg-brand-blue-light p-3.5">
              <p className="text-sm text-ink">{n.note}</p>
              <p className="mt-1 text-[10px] text-ink-3">{formatDateID(n.created_at.slice(0, 10))}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

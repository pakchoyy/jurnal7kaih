import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { NoteForm } from './NoteForm'
import { initials, formatDateID, habitColor, habitLight } from '@/lib/utils'
import { describeHabitNote } from '@/lib/schemas/habits'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Belum dikirim',
  submitted: 'Terkirim',
  reviewed: 'Sudah dicek',
}

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
        <Link prefetch={false} href="/teacher-dashboard" className="text-sm font-semibold text-brand-blue">
          ← Kembali
        </Link>
      </div>
    )
  }

  const { data: journals } = await supabase
    .from('journals')
    .select('id, journal_date, status, parent_note')
    .eq('student_id', student.id)
    .order('journal_date', { ascending: false })
    .limit(10)

  const latestJournal = journals?.[0]
  const latestJournalId = latestJournal?.id ?? null

  // Entries jurnal terakhir untuk menampilkan 7 kebiasaan
  const { data: entries } = latestJournalId
    ? await supabase
        .from('journal_entries')
        .select('status, note, habits(slug, name, icon, sort_order)')
        .eq('journal_id', latestJournalId)
    : { data: [] }

  const { data: notes } = await supabase
    .from('teacher_notes')
    .select('id, note, created_at')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <header className="flex items-center gap-3 border-b border-line bg-white/90 px-5 py-3.5">
        <Link prefetch={false} href="/teacher-dashboard" className="text-xl text-ink-3">
          ←
        </Link>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">
          {initials(student.name)}
        </span>
        <div>
          <h1 className="text-base font-black text-brand-blue">{student.name}</h1>
          <p className="text-sm text-ink-3">
            {latestJournal ? `Jurnal terakhir ${formatDateID(latestJournal.journal_date)}` : 'Belum ada jurnal'}
          </p>
        </div>
      </header>

      <div className="px-5 py-5">
        <Link prefetch={false}
          href={`/rapor/${student.id}`}
          className="mb-5 flex items-center justify-between rounded-card bg-white p-4 text-base font-bold text-brand-blue shadow-soft"
        >
          📄 Rapor Bulanan (cetak / PDF)
          <span className="text-ink-3">›</span>
        </Link>

        {entries && entries.length > 0 && (
          <>
            <p className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink-2">
              Jurnal Terakhir · {formatDateID(latestJournal!.journal_date)}
            </p>
            <ul className="mb-3 flex flex-col gap-2">
              {(entries as any[])
                .slice()
                .sort((a, b) => (a.habits?.sort_order ?? 0) - (b.habits?.sort_order ?? 0))
                .map((e, i) => {
                  const h = e.habits as { slug: string; name: string; icon: string } | null
                  const done = e.status === 'done'
                  const info = describeHabitNote(h?.slug ?? '', e.note)
                  return (
                    <li key={i} className="rounded-[12px] bg-white px-3 py-3 shadow-row">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
                          style={{ background: habitLight(h?.slug ?? '') }}
                        >
                          {h?.icon ?? '•'}
                        </span>
                        <span className="flex-1 text-sm font-bold text-ink">{h?.name}</span>
                        <span
                          className="text-base font-black"
                          style={{ color: done ? habitColor(h?.slug ?? '') : '#D1D5DB' }}
                        >
                          {done ? '✓' : '—'}
                        </span>
                      </div>
                      {(info.items.length > 0 || info.details.length > 0) && (
                        <p className="mt-1.5 text-sm text-ink-2">
                          {[...info.items, ...info.details.map(([l, v]) => `${l}: ${v}`)].join(' · ')}
                        </p>
                      )}
                    </li>
                  )
                })}
            </ul>
            {latestJournal?.parent_note && (
              <div className="mb-5 rounded-card border border-amber-200 bg-amber-50 p-3.5">
                <p className="text-xs font-bold uppercase text-amber-800">Pesan orang tua</p>
                <p className="mt-0.5 text-sm text-ink">{latestJournal.parent_note}</p>
              </div>
            )}
          </>
        )}

        {/* Riwayat jurnal */}
        <p className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
          Riwayat Jurnal
        </p>
        <ul className="stagger mb-5 flex flex-col gap-2">
          {(journals ?? []).map((j) => (
            <li key={j.id}>
              <Link prefetch={false}
                href={`/siswa/${student.id}/jurnal/${j.id}`}
                className="flex items-center justify-between pressable rounded-[12px] bg-white px-4 py-3.5 text-base shadow-row"
              >
                <span className="font-semibold">{formatDateID(j.journal_date)}</span>
                <span className="text-sm text-ink-3">{STATUS_LABEL[j.status] ?? j.status} ›</span>
              </Link>
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

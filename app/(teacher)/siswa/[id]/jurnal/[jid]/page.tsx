import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient, getUserCached } from '@/lib/supabase/server'
import { describeHabitNote } from '@/lib/schemas/habits'
import { formatDateID, habitColor, habitLight } from '@/lib/utils'
import { JournalThread } from '@/components/journal/JournalThread'
import { JournalPhotos } from '@/components/journal/JournalPhotos'
import { tandaiDicek } from './actions'

export default async function TeacherJournalDetail({ params }: { params: { id: string; jid: string } }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await getUserCached()

  const { data: journal } = await supabase
    .from('journals')
    .select('id, journal_date, status, parent_note, student_id, students(name)')
    .eq('id', params.jid)
    .eq('student_id', params.id)
    .maybeSingle()
  if (!journal) notFound()

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id, status, note, habits(name, slug, icon, sort_order)')
    .eq('journal_id', journal.id)

  const studentName = (journal.students as unknown as { name: string } | null)?.name ?? 'Siswa'
  const sorted = (entries ?? [])
    .map((e) => ({ ...e, habit: e.habits as unknown as { name: string; slug: string; icon: string; sort_order: number } | null }))
    .sort((a, b) => (a.habit?.sort_order ?? 0) - (b.habit?.sort_order ?? 0))
  const done = sorted.filter((e) => e.status === 'done').length

  return (
    <div className="px-5 py-5">
      <Link prefetch={false} href={`/siswa/${params.id}`} className="mb-2 inline-block py-1 text-sm font-semibold text-brand-blue">
        ← {studentName}
      </Link>
      <h1 className="font-display text-xl font-black text-ink">Jurnal {formatDateID(journal.journal_date)}</h1>
      <p className="mb-4 text-sm text-ink-3">
        {done}/{sorted.length} kebiasaan · {journal.status === 'reviewed' ? 'Sudah dicek ✓' : journal.status === 'draft' ? 'Belum dikirim' : 'Menunggu dicek'}
      </p>

      {journal.status === 'submitted' && (
        <form action={tandaiDicek.bind(null, journal.id, params.id)} className="mb-4">
          <button type="submit" className="w-full rounded-btn bg-emerald-600 py-3 text-base font-bold text-white">
            ✓ Tandai Sudah Dicek
          </button>
        </form>
      )}

      <ul className="stagger flex flex-col gap-2">
        {sorted.map((e) => {
          const info = describeHabitNote(e.habit?.slug ?? '', e.note)
          const ok = e.status === 'done'
          return (
            <li key={e.id} className="rounded-[12px] bg-white px-3 py-3 shadow-row">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
                  style={{ background: habitLight(e.habit?.slug ?? '') }}
                >
                  {e.habit?.icon}
                </span>
                <span className="flex-1 text-base font-bold text-ink">{e.habit?.name}</span>
                <span className="text-lg font-black" style={{ color: ok ? habitColor(e.habit?.slug ?? '') : '#D1D5DB' }}>
                  {ok ? '✓' : '—'}
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

      {journal.parent_note && (
        <div className="mt-4 rounded-card border border-amber-200 bg-amber-50 p-3.5">
          <p className="text-xs font-bold uppercase text-amber-800">Pesan orang tua</p>
          <p className="mt-0.5 text-base text-ink">{journal.parent_note}</p>
        </div>
      )}

      <JournalPhotos supabase={supabase} journalId={journal.id} />

      <JournalThread
        supabase={supabase}
        journalId={journal.id}
        userId={user!.id}
        title="Pesan dengan Orang Tua"
        placeholder="Tulis balasan / apresiasi untuk orang tua…"
      />
    </div>
  )
}

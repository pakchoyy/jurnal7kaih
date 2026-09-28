import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { describeHabitNote } from '@/lib/schemas/habits'
import { habitColor, habitLight, formatDateID, initials } from '@/lib/utils'

export default async function JurnalDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { data: journal } = await supabase
    .from('journals')
    .select('id, journal_date, status, parent_note, student_id, students(name)')
    .eq('id', params.id)
    .single()

  if (!journal) {
    return (
      <div className="px-5 py-8">
        <p className="text-ink-2">Jurnal tidak ditemukan.</p>
        <Link href="/jurnal" className="text-sm font-semibold text-brand-blue">
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
  const doneCount = (entries ?? []).filter((e: any) => e.status === 'done').length
  const total = (entries ?? []).length

  return (
    <div>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white/90 px-5 py-3.5 backdrop-blur">
        <Link href="/jurnal" className="text-xl text-ink-3">
          ←
        </Link>
        <div>
          <h1 className="text-base font-black text-brand-blue">{studentName}</h1>
          <p className="text-sm text-ink-3">{formatDateID(journal.journal_date)}</p>
        </div>
      </header>

      <div className="px-5 py-5">
        <div className="mb-4 flex items-center justify-between rounded-card bg-grad-blue px-4 py-3 text-white shadow-soft">
          <span className="text-sm font-semibold opacity-90">Kebiasaan selesai</span>
          <span className="font-display text-xl font-black">
            {doneCount}/{total}
          </span>
        </div>

        <ul className="flex flex-col gap-3">
          {(entries ?? []).map((e: any) => {
            const habit = e.habits as unknown as {
              name: string
              slug: string
              icon: string
              color: string
            } | null
            const info = describeHabitNote(habit?.slug ?? '', e.note)
            const color = habitColor(habit?.slug ?? '')
            const done = e.status === 'done'
            return (
              <li
                key={e.id}
                className="rounded-card bg-white p-4 shadow-soft"
                style={{ borderLeft: `4px solid ${color}` }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-display text-base font-extrabold text-ink">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg text-base"
                      style={{ background: habitLight(habit?.slug ?? '') }}>
                      {habit?.icon ?? '•'}
                    </span>
                    {habit?.name}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-bold"
                    style={{
                      background: done ? habitLight(habit?.slug ?? '') : '#F3F4F6',
                      color: done ? color : '#9CA3AF',
                    }}
                  >
                    {done ? 'Selesai' : 'Belum'}
                  </span>
                </div>
                {info.items.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {info.items.map((it) => (
                      <span
                        key={it}
                        className="rounded-pill px-2.5 py-1 text-xs font-semibold"
                        style={{ background: habitLight(habit?.slug ?? ''), color }}
                      >
                        ✓ {it}
                      </span>
                    ))}
                  </div>
                )}
                {info.details.map(([label, value]) => (
                  <p key={label} className="mt-1.5 break-words text-sm text-ink-2">
                    <span className="font-semibold text-ink">{label}:</span> {value}
                  </p>
                ))}
              </li>
            )
          })}
        </ul>

        {journal.parent_note && (
          <div className="mt-4 rounded-card border border-line bg-white p-4 shadow-row">
            <p className="mb-1 font-display text-xs font-bold uppercase text-ink-2">
              Catatan Orang Tua
            </p>
            <p className="text-sm text-ink">{journal.parent_note}</p>
          </div>
        )}

        {notes && notes.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
              Catatan Guru
            </p>
            <ul className="flex flex-col gap-2">
              {notes.map((n: any) => (
                <li key={n.id} className="rounded-card border border-brand-blue/15 bg-brand-blue-light p-3.5">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue text-[10px] font-bold text-white">
                      {initials((n.users as unknown as { name: string } | null)?.name ?? 'Guru')}
                    </span>
                    <span className="text-xs font-bold text-brand-blue">
                      {(n.users as unknown as { name: string } | null)?.name ?? 'Guru'}
                    </span>
                    <span className="text-[10px] text-ink-3">{n.created_at.slice(0, 10)}</span>
                  </div>
                  <p className="text-sm text-ink">{n.note}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

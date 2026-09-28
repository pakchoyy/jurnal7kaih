import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { habitColor, initials, todayISO } from '@/lib/utils'

type Range = 'today' | 'week' | 'month'

function rangeStart(range: Range): string {
  const d = new Date()
  if (range === 'week') d.setDate(d.getDate() - 6)
  if (range === 'month') d.setDate(d.getDate() - 29)
  return todayISO(d)
}

const RANGE_LABEL: Record<Range, string> = {
  today: 'Hari Ini',
  week: 'Minggu',
  month: 'Bulan',
}

export default async function TeacherDashboard({
  searchParams,
}: {
  searchParams: { range?: string }
}) {
  const range: Range =
    searchParams.range === 'week' || searchParams.range === 'month' ? searchParams.range : 'today'

  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user!.id)
    .single()

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, grade')
    .eq('homeroom_teacher_id', user!.id)

  const classIds = (classes ?? []).map((c) => c.id)
  const className = classes?.map((c) => c.name).join(', ') || 'Belum ada kelas'

  const { data: students } = classIds.length
    ? await supabase
        .from('students')
        .select('id, name')
        .in('class_id', classIds)
        .eq('status', 'active')
        .order('name')
    : { data: [] }

  const studentIds = (students ?? []).map((s) => s.id)
  const start = rangeStart(range)

  // Jurnal dalam rentang + entries
  const { data: journals } = studentIds.length
    ? await supabase
        .from('journals')
        .select('id, student_id, journal_date, status')
        .in('student_id', studentIds)
        .gte('journal_date', start)
        .lte('journal_date', todayISO())
        .neq('status', 'draft')
    : { data: [] }

  const journalIds = (journals ?? []).map((j) => j.id)
  const { data: entries } = journalIds.length
    ? await supabase
        .from('journal_entries')
        .select('journal_id, habit_id, status, habits(slug, name, icon)')
        .in('journal_id', journalIds)
    : { data: [] }

  // Map journal -> student
  const journalToStudent: Record<string, string> = {}
  for (const j of journals ?? []) journalToStudent[j.id] = j.student_id

  // Per siswa: set habit_id yang done
  const studentHabits: Record<string, Set<string>> = {}
  for (const e of entries ?? []) {
    const sid = journalToStudent[e.journal_id]
    if (!sid) continue
    if (e.status === 'done') {
      if (!studentHabits[sid]) studentHabits[sid] = new Set()
      studentHabits[sid].add(e.habit_id)
    }
  }

  // Habit breakdown
  const { data: habits } = await supabase
    .from('habits')
    .select('id, slug, name, icon')
    .eq('is_active', true)
    .order('sort_order')

  const habitCount: Record<string, number> = {}
  for (const e of entries ?? []) {
    if (e.status === 'done') habitCount[e.habit_id] = (habitCount[e.habit_id] ?? 0) + 1
  }

  const totalStudents = students?.length ?? 0
  const submittedJournals = journals?.length ?? 0
  // Hari efektif dalam rentang
  const daysInRange = range === 'today' ? 1 : range === 'week' ? 7 : 30
  const compliance =
    totalStudents > 0
      ? Math.round((submittedJournals / (totalStudents * daysInRange)) * 100)
      : 0

  const habitTotal = habits?.length ?? 7
  const denom = Math.max(1, submittedJournals)

  const stats = [
    { value: submittedJournals, label: 'Jurnal masuk', accent: true },
    { value: totalStudents, label: 'Total siswa', accent: false },
    { value: `${Math.min(100, compliance)}%`, label: 'Kepatuhan', accent: true },
    { value: className, label: 'Kelas diampu', accent: false, small: true },
  ]

  return (
    <div>
      {/* Header gelap ala mockup screen 3 */}
      <header className="bg-grad-dark px-5 pb-6 pt-6 text-white">
        <p className="text-[11px] opacity-60">Dashboard Guru · {className}</p>
        <h1 className="mb-4 font-display text-lg font-black">{profile?.name ?? 'Guru'}</h1>

        <div className="grid grid-cols-2 gap-2">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-[12px] border border-white/10 bg-white/[.08] px-3 py-2.5"
            >
              <p
                className={`font-display font-black leading-tight ${
                  s.small ? 'text-sm' : 'text-xl'
                } ${s.accent ? 'text-emerald-300' : 'text-white'}`}
              >
                {s.value}
              </p>
              <p className="mt-0.5 text-[10px] text-white/55">{s.label}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="px-5 py-5">
        {/* Filter tabs */}
        <div className="mb-4 flex gap-2">
          {(['today', 'week', 'month'] as Range[]).map((r) => (
            <Link
              key={r}
              href={`/teacher-dashboard?range=${r}`}
              className={`rounded-pill border-[1.5px] px-3.5 py-1.5 text-[11px] font-bold transition ${
                range === r
                  ? 'border-brand-blue bg-brand-blue text-white'
                  : 'border-line bg-white text-ink-2'
              }`}
            >
              {RANGE_LABEL[r]}
            </Link>
          ))}
        </div>

        {/* Rekap per siswa */}
        <p className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
          Rekap Per Siswa
        </p>

        {!students || students.length === 0 ? (
          <div className="rounded-card bg-white p-5 text-center text-sm text-ink-3 shadow-soft">
            Belum ada siswa di kelas Anda.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {students.map((s) => {
              const doneSet = studentHabits[s.id] ?? new Set<string>()
              const done = doneSet.size
              return (
                <li key={s.id}>
                  <Link
                    href={`/siswa/${s.id}`}
                    className="flex items-center gap-3 rounded-[12px] bg-white px-3.5 py-2.5 shadow-row"
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-blue text-[11px] font-bold text-white">
                      {initials(s.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[13px] font-extrabold text-ink">
                        {s.name}
                      </p>
                      <p className="text-[10px] text-ink-3">
                        {done}/{habitTotal} kebiasaan ✓
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {(habits ?? []).map((h: any) => (
                        <span
                          key={h.id}
                          className="h-2 w-2 rounded-full"
                          style={{
                            background: doneSet.has(h.id) ? habitColor(h.slug) : '#E5E7EB',
                          }}
                        />
                      ))}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {/* Breakdown per kebiasaan */}
        <p className="mb-3 mt-6 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
          Kepatuhan Per Kebiasaan · {RANGE_LABEL[range]}
        </p>
        <div className="flex flex-col gap-2.5 rounded-card bg-white p-4 shadow-soft">
          {(habits ?? []).map((h: any) => {
            const pct = Math.round(((habitCount[h.id] ?? 0) / denom) * 100)
            return (
              <div key={h.id} className="flex items-center gap-2.5">
                <span className="w-6 text-center text-sm">{h.icon}</span>
                <span className="w-24 flex-shrink-0 truncate text-[11px] font-semibold text-ink-2">
                  {h.name}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${Math.min(100, pct)}%`, background: habitColor(h.slug) }}
                  />
                </span>
                <span className="w-9 text-right text-[11px] font-bold text-ink-2">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { createServerClient, getUserCached } from '@/lib/supabase/server'
import { habitColor, initials, todayISO } from '@/lib/utils'
import { ReminderCard } from './ReminderCard'
import { FloatingHabits } from '@/components/ui/FloatingHabits'

import { getPeriod, type Range } from '@/lib/period'
import { PeriodNav } from './PeriodNav'
import { countSchoolDays, dayOffReason, getSchoolCalendar } from '@/lib/schoolCalendar'

const RANGE_LABEL: Record<Range, string> = {
  today: 'Harian',
  week: 'Mingguan',
  month: 'Bulanan',
}

export default async function TeacherDashboard({
  searchParams,
}: {
  searchParams: { range?: string; kelas?: string; mundur?: string }
}) {
  const range: Range =
    searchParams.range === 'week' || searchParams.range === 'month' ? searchParams.range : 'today'

  const supabase = createServerClient()
  const {
    data: { user },
  } = await getUserCached()

  const { data: profile } = await supabase
    .from('users')
    .select('name, school_id')
    .eq('id', user!.id)
    .single()

  // Profil + kalender + daftar kelas: tidak saling bergantung → paralel.
  const [{ data: allClasses }, cal] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name, grade, academic_years(is_active)')
      .eq('homeroom_teacher_id', user!.id)
      .order('grade')
      .order('name'),
    getSchoolCalendar(supabase, profile?.school_id ?? ''),
  ])

  const activeYear = (allClasses ?? []).filter(
    (c) => (c.academic_years as unknown as { is_active: boolean } | null)?.is_active,
  )
  const classes = activeYear.length ? activeYear : allClasses ?? []

  // Kelas yang dipilih (default: pertama)
  const selectedClassId = searchParams.kelas ?? classes[0]?.id ?? null
  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? classes[0] ?? null

  const classIds = selectedClassId ? [selectedClassId] : []

  // Siswa kelas terpilih + daftar kebiasaan: paralel.
  const [{ data: students }, { data: habits }] = classIds.length
    ? await Promise.all([
        supabase
          .from('students')
          .select('id, name')
          .in('class_id', classIds)
          .eq('status', 'active')
          .order('name'),
        supabase.from('habits').select('id, slug, name, icon').eq('is_active', true).order('sort_order'),
      ])
    : [
        { data: [] as { id: string; name: string }[] },
        { data: [] as { id: string; slug: string; name: string; icon: string }[] },
      ]

  const studentIds = (students ?? []).map((s) => s.id)
  const offset = Math.min(520, Math.max(0, parseInt(searchParams.mundur ?? '0', 10) || 0))
  const period = getPeriod(range, offset)
  const periodEnd = period.end < todayISO() ? period.end : todayISO()
  const schoolDays = countSchoolDays(period.start, periodEnd, cal)
  const periodOff = range === 'today' ? dayOffReason(period.start, cal) : null
  const todayOff = dayOffReason(todayISO(), cal)
  const href = (o: { range?: Range; mundur?: number; kelas?: string | null }) => {
    const q = new URLSearchParams()
    q.set('range', o.range ?? range)
    const m = o.mundur ?? offset
    if (m > 0) q.set('mundur', String(m))
    const k = o.kelas === undefined ? selectedClassId : o.kelas
    if (k) q.set('kelas', k)
    return `/teacher-dashboard?${q}`
  }

  // Jurnal periode + pengingat hari ini: paralel. Bila periode = hari ini,
  // pengingat dihitung dari hasil yang sama (hemat 1 round-trip).
  const todayStr = todayISO()
  const needToday = range !== 'today'
  const [{ data: journals }, { data: todayJournals }] = studentIds.length
    ? await Promise.all([
        supabase
          .from('journals')
          .select('id, student_id, journal_date, status')
          .in('student_id', studentIds)
          .gte('journal_date', period.start)
          .lte('journal_date', period.end)
          .neq('status', 'draft'),
        needToday
          ? supabase
              .from('journals')
              .select('student_id')
              .in('student_id', studentIds)
              .eq('journal_date', todayStr)
              .neq('status', 'draft')
          : Promise.resolve({ data: [] as { student_id: string }[] }),
      ])
    : [{ data: [] }, { data: [] as { student_id: string }[] }]

  const filledToday = new Set(
    (needToday ? todayJournals : journals)?.map((j) => j.student_id) ?? [],
  )
  const notFilledToday = (students ?? []).filter((s) => !filledToday.has(s.id)).map((s) => s.name)

  const journalIds = (journals ?? []).map((j) => j.id)
  // Tanpa join habits: nama/ikon diambil dari query habits tersendiri (payload jauh kecil).
  const { data: entries } = journalIds.length
    ? await supabase
        .from('journal_entries')
        .select('journal_id, habit_id, status')
        .in('journal_id', journalIds)
    : { data: [] }

  const journalToStudent: Record<string, string> = {}
  for (const j of journals ?? []) journalToStudent[j.id] = j.student_id

  const studentHabits: Record<string, Set<string>> = {}
  for (const e of entries ?? []) {
    const sid = journalToStudent[e.journal_id]
    if (!sid) continue
    if (e.status === 'done') {
      if (!studentHabits[sid]) studentHabits[sid] = new Set()
      studentHabits[sid].add(e.habit_id)
    }
  }

  const habitCount: Record<string, number> = {}
  for (const e of entries ?? []) {
    if (e.status === 'done') habitCount[e.habit_id] = (habitCount[e.habit_id] ?? 0) + 1
  }

  const daysFilled: Record<string, number> = {}
  for (const j of journals ?? []) daysFilled[j.student_id] = (daysFilled[j.student_id] ?? 0) + 1

  const totalStudents = students?.length ?? 0
  const submittedJournals = journals?.length ?? 0
  const compliance =
    totalStudents > 0 && schoolDays > 0
      ? Math.min(100, Math.round((submittedJournals / (totalStudents * schoolDays)) * 100))
      : 0

  const habitTotal = habits?.length ?? 7
  const denom = Math.max(1, submittedJournals)

  return (
    <div>
      <header className="relative overflow-hidden bg-grad-dark px-5 pb-6 pt-6 text-white">
        <FloatingHabits opacity="opacity-15" />
        <p className="text-[11px] opacity-60">Dashboard Guru</p>
        <h1 className="mb-4 font-display text-lg font-black">{profile?.name ?? 'Guru'}</h1>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-[12px] border border-white/10 bg-white/[.08] px-3 py-2.5">
            <p className="font-display text-xl font-black leading-tight text-emerald-300">
              {submittedJournals}
            </p>
            <p className="mt-0.5 text-[11px] text-white/70">Jurnal masuk</p>
          </div>
          <div className="rounded-[12px] border border-white/10 bg-white/[.08] px-3 py-2.5">
            <p className="font-display text-xl font-black leading-tight text-white">
              {totalStudents}
            </p>
            <p className="mt-0.5 text-[11px] text-white/70">Total siswa</p>
          </div>
          <div className="rounded-[12px] border border-white/10 bg-white/[.08] px-3 py-2.5">
            <p className="font-display text-xl font-black leading-tight text-emerald-300">
              {Math.min(100, compliance)}%
            </p>
            <p className="mt-0.5 text-[11px] text-white/70">Kepatuhan · {RANGE_LABEL[range].toLowerCase()}</p>
          </div>
        </div>
      </header>

      <div className="px-5 py-4">

        {/* Pilih kelas (jika lebih dari 1) */}
        {classes.length === 0 ? (
          <div className="mb-4 rounded-card bg-white p-5 text-center shadow-soft">
            <p className="text-sm text-ink-2">Belum ada kelas.</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link prefetch={false} href="/kelas/buat" className="rounded-btn bg-brand-blue px-4 py-3 text-base font-bold text-white">
                + Buat Kelas Pertama
              </Link>
              <Link prefetch={false} href="/kelas/import" className="rounded-btn border-2 border-brand-blue/30 px-4 py-3 text-base font-bold text-brand-blue">
                📥 Import Kelas dari Excel
              </Link>
            </div>
          </div>
        ) : classes.length > 1 ? (
          <div className="mb-4">
            <p className="mb-1.5 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
              Pilih Kelas
            </p>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {classes.map((c) => (
                <Link prefetch={false}
                  key={c.id}
                  href={href({ kelas: c.id })}
                  className={`rounded-pill border-[1.5px] px-3.5 py-1.5 text-[11px] font-bold transition ${
                    selectedClassId === c.id
                      ? 'border-brand-blue bg-brand-blue text-white'
                      : 'border-line bg-white text-ink-2'
                  }`}
                >
                  Kelas {c.name}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className="mb-3 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
            Kelas {selectedClass?.name}
          </p>
        )}

        {selectedClass && todayOff && (
          <div className="mb-4 rounded-card bg-sky-50 p-4 text-base font-semibold text-sky-900">
            🏖️ Hari ini libur ({todayOff}). Orang tua tidak wajib mengisi.
          </div>
        )}
        {selectedClass && !todayOff && (
          <ReminderCard className={selectedClass.name} names={notFilledToday} total={students?.length ?? 0} />
        )}

        {/* Filter rentang waktu */}
        <div className="mb-3 grid grid-cols-3 gap-1 rounded-btn bg-white p-1 shadow-row">
          {(['today', 'week', 'month'] as Range[]).map((r) => (
            <Link prefetch={false}
              key={r}
              href={href({ range: r, mundur: 0 })}
              scroll={false}
              className={`rounded-[10px] py-2.5 text-center text-sm font-bold transition-colors ${
                range === r ? 'bg-brand-blue text-white' : 'text-ink-2'
              }`}
            >
              {RANGE_LABEL[r]}
            </Link>
          ))}
        </div>

        <PeriodNav
          label={period.label}
          prevHref={href({ mundur: offset + 1 })}
          nextHref={offset > 0 ? href({ mundur: offset - 1 }) : null}
        >
        <div key={`${range}-${offset}`} className="page-enter">
        <p className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink-2">
          Rekap Per Siswa{range !== 'today' && ` · ${schoolDays} hari sekolah`}
        </p>
        {periodOff && (
          <p className="mb-2 rounded-btn bg-sky-50 p-3 text-sm font-semibold text-sky-900">
            🏖️ {periodOff} — hari libur, pengisian tidak wajib.
          </p>
        )}

        {!students || students.length === 0 ? (
          <div className="rounded-card bg-white p-5 text-center text-sm text-ink-3 shadow-soft">
            {classes.length === 0 ? 'Buat kelas dan tambahkan siswa dulu.' : 'Belum ada siswa di kelas ini.'}
          </div>
        ) : (
          <ul className="stagger flex flex-col gap-2">
            {students.map((s) => {
              const doneSet = studentHabits[s.id] ?? new Set<string>()
              const filled = daysFilled[s.id] ?? 0
              const pct = schoolDays ? Math.min(100, Math.round((filled / schoolDays) * 100)) : 0
              return (
                <li key={s.id}>
                  <Link prefetch={false}
                    href={`/siswa/${s.id}`}
                    className="pressable flex items-center gap-3 rounded-[12px] bg-white px-3.5 py-3 shadow-row"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">
                      {initials(s.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-extrabold text-ink">{s.name}</p>
                      {range === 'today' ? (
                        <p className={`text-xs ${filled || periodOff ? 'text-ink-3' : 'font-semibold text-amber-700'}`}>
                          {filled ? `${doneSet.size}/${habitTotal} kebiasaan ✓` : periodOff ? 'Libur' : 'Belum mengisi'}
                        </p>
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                            <span
                              className={`bar-grow block h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </span>
                          <span className="text-xs font-semibold text-ink-3">
                            {filled}/{schoolDays} hari
                          </span>
                        </div>
                      )}
                    </div>
                    {range === 'today' && (
                      <div className="flex gap-1">
                        {(habits ?? []).map((h: any) => (
                          <span
                            key={h.id}
                            className="h-2 w-2 rounded-full"
                            style={{ background: doneSet.has(h.id) ? habitColor(h.slug) : '#E5E7EB' }}
                          />
                        ))}
                      </div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {/* Breakdown per kebiasaan */}
        {submittedJournals > 0 && (
          <>
            <p className="mb-3 mt-6 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
              Per Kebiasaan · {period.label}
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
          </>
        )}
        </div>
        </PeriodNav>
      </div>
    </div>
  )
}

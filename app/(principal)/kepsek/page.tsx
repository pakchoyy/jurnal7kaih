import { createServerClient, getUserCached } from '@/lib/supabase/server'
import { habitColor, shiftISO, todayISO } from '@/lib/utils'
import { InstallCard } from '@/components/pwa/InstallPrompt'
import { countSchoolDays, getSchoolCalendar } from '@/lib/schoolCalendar'

export default async function KepsekDashboard() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await getUserCached()
  const { data: me } = await supabase.from('users').select('name, school_id').eq('id', user!.id).single()

  const today = todayISO()
  const cal = await getSchoolCalendar(supabase, me?.school_id ?? '')
  const week = Math.max(1, countSchoolDays(shiftISO(today, -6), today, cal))

  const [{ data: classStats }, { data: habitStats }, { data: habits }] = await Promise.all([
    supabase.rpc('principal_class_stats', { p_today: today }),
    supabase.rpc('principal_habit_stats', { p_from: shiftISO(today, -29) }),
    supabase.from('habits').select('id, slug, name, icon').eq('is_active', true).order('sort_order'),
  ])

  type ClassStat = {
    class_id: string
    class_name: string
    teacher_name: string | null
    total_students: number
    today_count: number
    week_count: number
  }
  const stats = ((classStats ?? []) as ClassStat[]).map((c) => ({
    id: c.class_id,
    name: c.class_name,
    teacher: c.teacher_name ?? '-',
    total: Number(c.total_students),
    todayCount: Number(c.today_count),
    weekPct: Number(c.total_students) ? Math.round((Number(c.week_count) / (Number(c.total_students) * week)) * 100) : 0,
  }))

  const totalStudents = stats.reduce((a, c) => a + c.total, 0)
  const todayAll = stats.reduce((a, c) => a + c.todayCount, 0)
  const weekAll = ((classStats ?? []) as ClassStat[]).reduce((a, c) => a + Number(c.week_count), 0)
  const weekPctAll = totalStudents ? Math.round((weekAll / (totalStudents * week)) * 100) : 0
  const hs = (habitStats ?? []) as { habit_id: string; done_count: number; journal_count: number }[]
  const totalJournals30 = Number(hs[0]?.journal_count ?? 0)
  const habitCount: Record<string, number> = Object.fromEntries(hs.map((h) => [h.habit_id, Number(h.done_count)]))

  return (
    <div className="px-5 py-5">
      <h1 className="font-display text-xl font-black text-ink">Halo, {me?.name}</h1>
      <p className="mb-4 text-sm text-ink-3">Rekap seluruh kelas tahun ajaran aktif</p>

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-card bg-white p-3 shadow-soft">
          <p className="font-display text-2xl font-black text-brand-blue">{totalStudents}</p>
          <p className="text-xs text-ink-3">Siswa</p>
        </div>
        <div className="rounded-card bg-white p-3 shadow-soft">
          <p className="font-display text-2xl font-black text-emerald-600">{todayAll}</p>
          <p className="text-xs text-ink-3">Isi hari ini</p>
        </div>
        <div className="rounded-card bg-white p-3 shadow-soft">
          <p className="font-display text-2xl font-black text-amber-600">{Math.min(100, weekPctAll)}%</p>
          <p className="text-xs text-ink-3">Kepatuhan 7 hari</p>
        </div>
      </div>

      <p className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink-2">Per Kelas</p>
      {stats.length === 0 ? (
        <div className="mb-5 rounded-card bg-white p-5 text-center text-base text-ink-3 shadow-soft">Belum ada kelas.</div>
      ) : (
        <ul className="stagger mb-5 flex flex-col gap-2">
          {stats
            .slice()
            .sort((a, b) => b.weekPct - a.weekPct)
            .map((c) => (
              <li key={c.id} className="rounded-card bg-white p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-ink">Kelas {c.name}</p>
                  <p className="text-sm font-bold text-ink-2">{Math.min(100, c.weekPct)}%</p>
                </div>
                <p className="text-sm text-ink-3">
                  {c.teacher} · {c.todayCount}/{c.total} isi hari ini
                </p>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line">
                  <div className="bar-grow h-full rounded-full bg-brand-blue" style={{ width: `${Math.min(100, c.weekPct)}%` }} />
                </div>
              </li>
            ))}
        </ul>
      )}

      <p className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink-2">Per Kebiasaan · 30 Hari</p>
      <div className="mb-5 flex flex-col gap-3 rounded-card bg-white p-4 shadow-soft">
        {(habits ?? []).map((h) => {
          const pct = totalJournals30 ? Math.round(((habitCount[h.id] ?? 0) / totalJournals30) * 100) : 0
          return (
            <div key={h.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold text-ink">
                  {h.icon} {h.name}
                </span>
                <span className="font-bold text-ink-2">{pct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-line">
                <div className="bar-grow h-full rounded-full" style={{ width: `${pct}%`, background: habitColor(h.slug) }} />
              </div>
            </div>
          )
        })}
      </div>

      <InstallCard />
    </div>
  )
}

import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { bestStreak, calculateStreak, formatDateID, habitColor, shiftISO, todayISO } from '@/lib/utils'
import { BadgeShelf } from '@/components/parent/BadgeShelf'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Belum dikirim',
  submitted: 'Terkirim',
  reviewed: 'Sudah dicek guru ✓',
}

export default async function RiwayatPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: links } = await supabase
    .from('student_parents')
    .select('student_id, students(name)')
    .eq('user_id', user!.id)
    .limit(1)

  const studentId = links?.[0]?.student_id
  const studentName = (links?.[0]?.students as unknown as { name: string } | null)?.name ?? 'Siswa'

  if (!studentId) {
    return <div className="px-5 py-10 text-center text-base text-ink-2">Akun belum terhubung ke data anak.</div>
  }

  const today = todayISO()
  const from30 = shiftISO(today, -29)

  const [{ data: journals }, { data: habits }] = await Promise.all([
    supabase
      .from('journals')
      .select('id, journal_date, status')
      .eq('student_id', studentId)
      .order('journal_date', { ascending: false })
      .limit(120),
    supabase.from('habits').select('id, slug, name, icon').eq('is_active', true).order('sort_order'),
  ])

  const submitted = (journals ?? []).filter((j) => j.status !== 'draft').map((j) => j.journal_date)
  const streak = calculateStreak(submitted)
  const best = bestStreak(submitted)

  const recentIds = (journals ?? [])
    .filter((j) => j.status !== 'draft' && j.journal_date >= from30)
    .map((j) => j.id)
  const { data: entries } = recentIds.length
    ? await supabase.from('journal_entries').select('habit_id, status').in('journal_id', recentIds)
    : { data: [] as { habit_id: string; status: string }[] }

  const doneByHabit: Record<string, number> = {}
  for (const e of entries ?? []) {
    if (e.status === 'done') doneByHabit[e.habit_id] = (doneByHabit[e.habit_id] ?? 0) + 1
  }

  const days = Array.from({ length: 30 }, (_, i) => {
    const date = shiftISO(from30, i)
    return { date, done: submitted.includes(date) }
  })
  const filledCount = days.filter((d) => d.done).length

  return (
    <div>
      <header className="bg-grad-purple px-5 pb-6 pt-6 text-white">
        <h1 className="font-display text-2xl font-black">Perkembangan</h1>
        <p className="text-sm opacity-90">{studentName}</p>
      </header>

      <div className="flex flex-col gap-4 px-5 py-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-card bg-white p-4 text-center shadow-soft">
            <p className="font-display text-3xl font-black text-brand-yellow">🔥 {streak}</p>
            <p className="mt-0.5 text-sm text-ink-3">Hari berturut-turut</p>
          </div>
          <div className="rounded-card bg-white p-4 text-center shadow-soft">
            <p className="font-display text-3xl font-black text-brand-green">{filledCount}/30</p>
            <p className="mt-0.5 text-sm text-ink-3">Hari terisi</p>
          </div>
        </div>

        <BadgeShelf best={best} current={streak} />

        <Link
          href={`/rapor/${studentId}`}
          className="flex items-center justify-between rounded-card bg-white p-4 text-base font-bold text-brand-blue shadow-soft"
        >
          📄 Rapor Bulanan (cetak / PDF)
          <span className="text-ink-3">›</span>
        </Link>

        <div className="rounded-card bg-white p-4 shadow-soft">
          <p className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-2">
            Per Kebiasaan · 30 Hari
          </p>
          <div className="flex flex-col gap-3">
            {(habits ?? []).map((h) => {
              const count = doneByHabit[h.id] ?? 0
              const pct = Math.round((count / 30) * 100)
              return (
                <div key={h.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">
                      {h.icon} {h.name}
                    </span>
                    <span className="font-bold text-ink-2">{count} hari</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: habitColor(h.slug) }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-card bg-white p-4 shadow-soft">
          <p className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-2">Kalender 30 Hari</p>
          <div className="grid grid-cols-10 gap-1.5">
            {days.map((d) => (
              <div
                key={d.date}
                title={formatDateID(d.date)}
                className={`aspect-square rounded-md ${d.done ? 'bg-brand-green' : 'bg-line'} ${d.date === today ? 'ring-2 ring-brand-blue ring-offset-1' : ''}`}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm text-ink-3">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-brand-green" /> Terisi
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-line" /> Kosong
            </span>
          </div>
        </div>

        <div>
          <p className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink-2">Daftar Jurnal</p>
          <ul className="flex flex-col gap-2">
            {(journals ?? []).slice(0, 30).map((j) => (
              <li key={j.id}>
                <Link
                  href={`/jurnal/${j.id}`}
                  className="flex items-center justify-between rounded-[12px] bg-white px-4 py-3.5 text-base shadow-row"
                >
                  <span className="font-semibold">{formatDateID(j.journal_date)}</span>
                  <span className="text-sm text-ink-3">{STATUS_LABEL[j.status] ?? j.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

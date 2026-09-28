import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { calculateStreak, todayISO, formatDateID } from '@/lib/utils'

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
  const studentName =
    (links?.[0]?.students as unknown as { name: string } | null)?.name ?? 'Siswa'

  if (!studentId) {
    return <div className="px-5 py-8 text-ink-2">Belum ada anak terhubung.</div>
  }

  const { data: journals } = await supabase
    .from('journals')
    .select('id, journal_date, status')
    .eq('student_id', studentId)
    .order('journal_date', { ascending: false })
    .limit(60)

  const submitted = (journals ?? [])
    .filter((j) => j.status !== 'draft')
    .map((j) => j.journal_date)
  const streak = calculateStreak(submitted)

  const days: { date: string; done: boolean }[] = []
  const cursor = new Date()
  for (let i = 0; i < 30; i++) {
    const iso = todayISO(cursor)
    days.unshift({ date: iso, done: submitted.includes(iso) })
    cursor.setDate(cursor.getDate() - 1)
  }
  const filledCount = days.filter((d) => d.done).length

  return (
    <div>
      <header className="bg-grad-purple px-5 pb-6 pt-6 text-white">
        <h1 className="font-display text-xl font-black">Riwayat</h1>
        <p className="text-[11px] opacity-80">{studentName}</p>
      </header>

      <div className="px-5 py-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-card bg-white p-4 text-center shadow-soft">
            <p className="font-display text-3xl font-black text-brand-yellow">🔥 {streak}</p>
            <p className="mt-0.5 text-[11px] text-ink-3">Streak (hari)</p>
          </div>
          <div className="rounded-card bg-white p-4 text-center shadow-soft">
            <p className="font-display text-3xl font-black text-brand-green">{filledCount}</p>
            <p className="mt-0.5 text-[11px] text-ink-3">Terisi / 30 hari</p>
          </div>
        </div>

        <div className="mt-5 rounded-card bg-white p-4 shadow-soft">
          <p className="mb-3 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
            30 Hari Terakhir
          </p>
          <div className="grid grid-cols-10 gap-1.5">
            {days.map((d) => (
              <div
                key={d.date}
                title={d.date}
                className={`aspect-square rounded-md ${
                  d.done ? 'bg-brand-green' : 'bg-line'
                }`}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-ink-3">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-brand-green" /> Terisi
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-line" /> Kosong
            </span>
          </div>
        </div>

        <p className="mb-2 mt-5 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
          Daftar Jurnal
        </p>
        <ul className="flex flex-col gap-2">
          {(journals ?? []).map((j) => (
            <li key={j.id}>
              <Link
                href={`/jurnal/${j.id}`}
                className="flex items-center justify-between rounded-[12px] bg-white px-4 py-3 text-sm shadow-row"
              >
                <span className="font-semibold">{formatDateID(j.journal_date)}</span>
                <span className="text-xs text-ink-3">{j.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

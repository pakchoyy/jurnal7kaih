import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { calculateStreak, todayISO } from '@/lib/utils'

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
    return <div className="px-5 py-6 text-gray-500">Belum ada anak terhubung.</div>
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

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-black text-brand-blue">Riwayat {studentName}</h1>

      <div className="mt-4 flex gap-3">
        <div className="flex-1 rounded-card bg-white p-4 text-center shadow-sm">
          <p className="text-3xl font-black text-brand-blue">{streak}</p>
          <p className="text-xs text-gray-500">Streak (hari)</p>
        </div>
        <div className="flex-1 rounded-card bg-white p-4 text-center shadow-sm">
          <p className="text-3xl font-black text-brand-green">
            {days.filter((d) => d.done).length}
          </p>
          <p className="text-xs text-gray-500">Terisi / 30 hari</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-gray-500">30 hari terakhir</p>
        <div className="grid grid-cols-10 gap-1.5">
          {days.map((d) => (
            <div
              key={d.date}
              title={d.date}
              className={`aspect-square rounded-md ${
                d.done ? 'bg-brand-green' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold text-gray-500">Daftar jurnal</p>
        <ul className="flex flex-col gap-2">
          {(journals ?? []).map((j) => (
            <li key={j.id}>
              <Link
                href={`/jurnal/${j.id}`}
                className="flex items-center justify-between rounded-card bg-white p-3 text-sm shadow-sm"
              >
                <span>{j.journal_date}</span>
                <span className="text-gray-400">{j.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

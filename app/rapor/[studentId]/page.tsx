import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { describeHabitNote } from '@/lib/schemas/habits'
import { themeVars } from '@/lib/theme'
import { bestStreak, habitColor, shiftISO, todayISO } from '@/lib/utils'
import { PrintButton } from './PrintButton'

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function predikat(pct: number) {
  if (pct >= 80) return { label: 'Sangat Baik', cls: 'text-emerald-700' }
  if (pct >= 60) return { label: 'Baik', cls: 'text-blue-700' }
  if (pct >= 40) return { label: 'Cukup', cls: 'text-amber-700' }
  return { label: 'Perlu Bimbingan', cls: 'text-red-700' }
}

function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return d.toISOString().slice(0, 7)
}

export default async function RaporPage({
  params,
  searchParams,
}: {
  params: { studentId: string }
  searchParams: { bulan?: string }
}) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = todayISO()
  const thisMonth = today.slice(0, 7)
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(searchParams.bulan ?? '') ? searchParams.bulan! : thisMonth
  const [year, mon] = month.split('-').map(Number)
  const firstDay = `${month}-01`
  const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate()
  const lastDay = shiftISO(firstDay, daysInMonth - 1)
  const periodEnd = month === thisMonth ? today : lastDay
  const periodDays = month > thisMonth ? 0 : Number(periodEnd.slice(8, 10))

  // RLS memastikan hanya ortu / wali kelas siswa ini yang bisa membaca.
  const { data: student } = await supabase
    .from('students')
    .select('id, name, student_number, school_id, classes(name, users(name)), schools(name, logo_url, theme_color)')
    .eq('id', params.studentId)
    .maybeSingle()
  if (!student) notFound()

  const kelas = student.classes as unknown as { name: string; users: { name: string } | null } | null
  const school = student.schools as unknown as { name: string; logo_url: string | null; theme_color: string | null } | null

  const [{ data: habits }, { data: journals }, { data: notes }, { data: me }] = await Promise.all([
    supabase.from('habits').select('id, slug, name, icon').eq('is_active', true).order('sort_order'),
    supabase
      .from('journals')
      .select('id, journal_date, status')
      .eq('student_id', student.id)
      .neq('status', 'draft')
      .gte('journal_date', firstDay)
      .lte('journal_date', lastDay),
    supabase
      .from('teacher_notes')
      .select('note, created_at')
      .eq('student_id', student.id)
      .gte('created_at', `${firstDay}T00:00:00+07:00`)
      .lte('created_at', `${lastDay}T23:59:59+07:00`)
      .order('created_at'),
    supabase.from('users').select('role').eq('id', user.id).single(),
  ])

  const journalIds = (journals ?? []).map((j) => j.id)
  const { data: entries } = journalIds.length
    ? await supabase.from('journal_entries').select('habit_id, status, note').in('journal_id', journalIds)
    : { data: [] as { habit_id: string; status: string; note: string | null }[] }

  const filledDates = (journals ?? []).map((j) => j.journal_date)
  const filled = filledDates.length
  const fillPct = periodDays ? Math.round((filled / periodDays) * 100) : 0

  const rows = (habits ?? []).map((h) => {
    const mine = (entries ?? []).filter((e) => e.habit_id === h.id && e.status === 'done')
    const counts: Record<string, number> = {}
    for (const e of mine) {
      for (const it of describeHabitNote(h.slug, e.note).items) counts[it] = (counts[it] ?? 0) + 1
    }
    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k)
    const pct = periodDays ? Math.round((mine.length / periodDays) * 100) : 0
    return { ...h, days: mine.length, pct, top }
  })
  const avg = rows.length ? Math.round(rows.reduce((a, r) => a + r.pct, 0) / rows.length) : 0
  const backHref = me?.role === 'parent' ? '/riwayat' : `/siswa/${student.id}`

  return (
    <div className="mx-auto min-h-dvh max-w-3xl bg-white" style={themeVars(school?.theme_color)}>
      <div className="no-print flex flex-wrap items-center gap-2 border-b border-line bg-bg px-4 py-3">
        <Link href={backHref} className="py-2 text-sm font-semibold text-brand-blue">
          ← Kembali
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <Link
            href={`?bulan=${shiftMonth(month, -1)}`}
            className="rounded-btn border border-line bg-white px-3 py-2 text-sm font-bold"
            aria-label="Bulan sebelumnya"
          >
            ‹
          </Link>
          <span className="px-2 text-sm font-bold">
            {MONTHS[mon - 1]} {year}
          </span>
          {month < thisMonth && (
            <Link
              href={`?bulan=${shiftMonth(month, 1)}`}
              className="rounded-btn border border-line bg-white px-3 py-2 text-sm font-bold"
              aria-label="Bulan berikutnya"
            >
              ›
            </Link>
          )}
        </div>
      </div>

      <article className="px-6 py-6 text-ink">
        <header className="flex items-center gap-4 border-b-2 border-brand-blue pb-4">
          {school?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logo_url} alt="" className="h-16 w-16 object-contain" />
          ) : (
            <span className="text-4xl">🏫</span>
          )}
          <div>
            <p className="text-sm font-semibold text-ink-2">{school?.name}</p>
            <h1 className="font-display text-xl font-black text-brand-blue">Rapor 7 Kebiasaan Anak Indonesia Hebat</h1>
            <p className="text-sm text-ink-2">
              Bulan {MONTHS[mon - 1]} {year}
            </p>
          </div>
        </header>

        <table className="mt-4 text-sm">
          <tbody>
            <tr>
              <td className="pr-4 text-ink-2">Nama</td>
              <td className="font-bold">: {student.name}</td>
            </tr>
            <tr>
              <td className="pr-4 text-ink-2">NIS</td>
              <td>: {student.student_number ?? '-'}</td>
            </tr>
            <tr>
              <td className="pr-4 text-ink-2">Kelas</td>
              <td>: {kelas?.name ?? '-'}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-btn bg-brand-blue-light p-3">
            <p className="font-display text-2xl font-black text-brand-blue">
              {filled}/{periodDays}
            </p>
            <p className="text-xs text-ink-2">Hari mengisi ({fillPct}%)</p>
          </div>
          <div className="rounded-btn bg-amber-50 p-3">
            <p className="font-display text-2xl font-black text-amber-700">{bestStreak(filledDates)}</p>
            <p className="text-xs text-ink-2">Rekor berturut-turut</p>
          </div>
          <div className="rounded-btn bg-emerald-50 p-3">
            <p className="font-display text-2xl font-black text-emerald-700">{avg}%</p>
            <p className="text-xs text-ink-2">Rata-rata · {predikat(avg).label}</p>
          </div>
        </div>

        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-line text-left">
              <th className="py-2">Kebiasaan</th>
              <th className="py-2 text-center">Hari</th>
              <th className="py-2 text-center">%</th>
              <th className="py-2">Predikat</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const p = predikat(r.pct)
              return (
                <tr key={r.id} className="border-b border-line align-top">
                  <td className="py-2 pr-2">
                    <span className="font-semibold">
                      {r.icon} {r.name}
                    </span>
                    {r.top.length > 0 && <p className="text-xs text-ink-3">Sering: {r.top.join(', ')}</p>}
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                      <div className="h-full" style={{ width: `${r.pct}%`, background: habitColor(r.slug) }} />
                    </div>
                  </td>
                  <td className="py-2 text-center">{r.days}</td>
                  <td className="py-2 text-center font-bold">{r.pct}</td>
                  <td className={`py-2 font-semibold ${p.cls}`}>{p.label}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <section className="mt-5">
          <h2 className="mb-2 text-sm font-bold uppercase text-ink-2">Catatan Wali Kelas</h2>
          {notes && notes.length > 0 ? (
            <ul className="list-disc pl-5 text-sm">
              {notes.map((n, i) => (
                <li key={i}>{n.note}</li>
              ))}
            </ul>
          ) : (
            <div className="h-16 rounded-btn border border-dashed border-line" />
          )}
        </section>

        <section className="mt-10 grid grid-cols-2 gap-8 text-center text-sm">
          <div>
            <p>Orang Tua / Wali</p>
            <div className="h-16" />
            <p className="border-t border-ink pt-1">(......................................)</p>
          </div>
          <div>
            <p>Wali Kelas</p>
            <div className="h-16" />
            <p className="border-t border-ink pt-1 font-semibold">{kelas?.users?.name ?? '(......................................)'}</p>
          </div>
        </section>

        <div className="no-print mt-8 flex justify-center">
          <PrintButton />
        </div>
        <p className="no-print mt-2 text-center text-xs text-ink-3">
          Di HP: pilih printer “Simpan sebagai PDF” untuk menyimpan file.
        </p>
      </article>
    </div>
  )
}

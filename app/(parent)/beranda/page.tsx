import { createServerClient } from '@/lib/supabase/server'
import { calculateStreak, todayISO } from '@/lib/utils'

export default async function BerandaPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: links } = await supabase
    .from('student_parents')
    .select('student_id, relationship, students(id, name, class_id)')
    .eq('user_id', user!.id)

  const children = (links ?? []).map((l: any) => ({
    id: l.student_id,
    name: (l.students as unknown as { name: string } | null)?.name ?? 'Siswa',
    relationship: l.relationship,
  }))

  const firstChild = children[0]?.id
  let streak = 0
  let todayDone = false

  if (firstChild) {
    const { data: journals } = await supabase
      .from('journals')
      .select('journal_date, status')
      .eq('student_id', firstChild)
      .in('status', ['submitted', 'reviewed'])
      .order('journal_date', { ascending: false })
      .limit(90)

    const dates = ((journals ?? []) as Array<{ journal_date: string }>).map((j) => j.journal_date)
    streak = calculateStreak(dates)
    todayDone = dates.includes(todayISO())
  }

  return (
    <div className="px-5 py-6">
      <header className="mb-5">
        <p className="text-sm text-gray-500">Selamat datang,</p>
        <h1 className="text-2xl font-black text-brand-blue">Orang Tua Hebat</h1>
      </header>

      {children.length === 0 ? (
        <div className="rounded-card bg-white p-5 text-center shadow-sm">
          <p className="text-gray-500">Belum ada anak terhubung.</p>
          <p className="mt-1 text-sm text-gray-400">
            Tambahkan anak lewat menu Profil bila punya kode aktivasi.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-card bg-brand-blue p-5 text-white shadow">
            <p className="text-sm opacity-80">Streak {children[0].name}</p>
            <p className="text-4xl font-black">{streak} hari</p>
            <p className="mt-1 text-sm opacity-80">
              {todayDone ? 'Jurnal hari ini sudah diisi ✓' : 'Jurnal hari ini belum diisi'}
            </p>
          </div>

          {children.length > 1 && (
            <div className="mb-4 rounded-card bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-semibold text-gray-500">Anak saya</p>
              <ul className="flex flex-col gap-2">
                {children.map((c) => (
                  <li key={c.id} className="flex items-center justify-between">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-gray-400">{c.relationship}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <a
            href="/jurnal/isi"
            className="block rounded-card bg-brand-yellow p-5 text-center font-bold text-brand-dark shadow-sm"
          >
            Isi Jurnal Hari Ini
          </a>
        </>
      )}
    </div>
  )
}

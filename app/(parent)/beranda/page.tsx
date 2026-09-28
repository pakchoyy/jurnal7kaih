import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { calculateStreak, todayISO, habitColor, habitLight } from '@/lib/utils'
import { ProgressRing } from '@/components/ui/ProgressRing'

export default async function BerandaPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user!.id)
    .single()

  const { data: links } = await supabase
    .from('student_parents')
    .select('student_id, relationship, students(id, name, class_id, classes(homeroom_teacher_id, users(name, whatsapp)))')
    .eq('user_id', user!.id)

  const children = (links ?? []).map((l: any) => ({
    id: l.student_id,
    name: (l.students as unknown as { name: string } | null)?.name ?? 'Siswa',
    relationship: l.relationship,
  }))

  // Ambil WA guru dari kelas anak pertama
  const firstLink = (links ?? [])[0] as any
  const teacherWA = firstLink?.students?.classes?.users?.whatsapp as string | null
  const teacherName = firstLink?.students?.classes?.users?.name as string | null

  const firstChild = children[0]?.id
  let streak = 0
  let todayDone = false
  let doneCount = 0

  // Daftar habit
  const { data: habits } = await supabase
    .from('habits')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('sort_order')

  let entryStatus: Record<string, string> = {}

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

    // Ambil jurnal hari ini + entry untuk progress
    const { data: todayJournal } = await supabase
      .from('journals')
      .select('id')
      .eq('student_id', firstChild)
      .eq('journal_date', todayISO())
      .maybeSingle()

    if (todayJournal) {
      const { data: entries } = await supabase
        .from('journal_entries')
        .select('habit_id, status')
        .eq('journal_id', todayJournal.id)
      entryStatus = Object.fromEntries(
        ((entries ?? []) as Array<{ habit_id: string; status: string }>).map((e) => [
          e.habit_id,
          e.status,
        ]),
      )
      doneCount = (entries ?? []).filter((e: any) => e.status === 'done').length
    }
  }

  const habitTotal = habits?.length ?? 7
  const progress = habitTotal ? Math.round((doneCount / habitTotal) * 100) : 0

  return (
    <div>
      {/* Header gradien biru ala mockup */}
      <header className="relative overflow-hidden bg-grad-blue px-5 pb-7 pt-6 text-white">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/[.07]" />
        <div className="pointer-events-none absolute -bottom-6 left-8 h-20 w-20 rounded-full bg-white/[.05]" />

        <div className="relative">
          <p className="text-xs font-medium opacity-80">Selamat datang,</p>
          <h1 className="mb-4 text-xl font-black">{profile?.name ?? 'Orang Tua Hebat'}</h1>

          <div className="flex items-center gap-3 rounded-[14px] border border-white/20 bg-white/15 p-3 backdrop-blur-sm">
            <ProgressRing
              value={progress}
              size={48}
              stroke={6}
              color="#34D399"
              trackColor="rgba(255,255,255,.2)"
              label={<span className="text-[11px] text-white">{progress}%</span>}
            />
            <div className="flex-1">
              <p className="text-[10px] font-medium uppercase tracking-wide opacity-75">
                Progress hari ini
              </p>
              <p className="font-display text-sm font-black">
                {doneCount}/{habitTotal} kebiasaan
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide opacity-75">Streak</p>
              <p className="font-display text-lg font-black text-brand-yellow">🔥 {streak}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-5 py-5">
        {children.length === 0 ? (
          <div className="rounded-card bg-white p-6 text-center shadow-soft">
            <p className="text-ink-2">Belum ada anak terhubung.</p>
            <p className="mt-1 text-sm text-ink-3">
              Tambahkan anak lewat menu Profil bila punya kode aktivasi.
            </p>
          </div>
        ) : (
          <>
            {/* Tombol isi jurnal */}
            <Link
              href="/jurnal/isi"
              className={`mb-5 flex items-center justify-between rounded-card p-4 shadow-soft transition active:scale-[.99] ${
                todayDone ? 'bg-brand-green text-white' : 'bg-brand-yellow text-brand-dark'
              }`}
            >
              <div>
                <p className="font-display text-sm font-black">
                  {todayDone ? 'Jurnal hari ini sudah diisi ✓' : 'Isi Jurnal Hari Ini'}
                </p>
                <p className="text-xs opacity-80">
                  {todayDone ? 'Ketuk untuk melihat / ubah' : 'Yuk lengkapi 7 kebiasaan anak'}
                </p>
              </div>
              <span className="text-2xl">{todayDone ? '✅' : '📝'}</span>
            </Link>

            {/* Preview kebiasaan hari ini */}
            <p className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
              Kebiasaan Hari Ini
            </p>
            <ul className="flex flex-col gap-2">
              {(habits ?? []).map((h: any) => {
                const done = entryStatus[h.id] === 'done'
                return (
                  <li
                    key={h.id}
                    className="flex items-center gap-3 rounded-[12px] bg-white px-3.5 py-2.5 shadow-row"
                  >
                    <span
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ background: habitColor(h.slug) }}
                    />
                    <span className="flex-1 text-sm font-semibold text-ink">{h.name}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        background: done ? habitLight(h.slug) : '#F3F4F6',
                        color: done ? habitColor(h.slug) : '#9CA3AF',
                      }}
                    >
                      {done ? 'Selesai' : 'Belum'}
                    </span>
                  </li>
                )
              })}
            </ul>

            {children.length > 1 && (
              <div className="mt-5 rounded-card bg-white p-4 shadow-soft">
                <p className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
                  Anak Saya
                </p>
                <ul className="flex flex-col gap-2">
                  {children.map((c) => (
                    <li key={c.id} className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{c.name}</span>
                      <span className="text-xs text-ink-3">{c.relationship}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Kontak Wali Kelas */}
            {teacherWA && (
              <div className="mt-5 rounded-[12px] border border-line bg-white p-4 shadow-row">
                <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-3">
                  Wali Kelas
                </p>
                <p className="mb-2 text-sm font-semibold text-ink">{teacherName ?? 'Guru'}</p>
                <a
                  href={`https://wa.me/${teacherWA.replace(/\D/g, '')}?text=Halo+Pak/Bu+Guru%2C+saya+orang+tua+siswa+ingin+bertanya.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-btn bg-emerald-500 px-4 py-2 text-sm font-bold text-white"
                >
                  <span>💬</span> Hubungi via WA
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

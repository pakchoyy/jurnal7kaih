import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { bestStreak, calculateStreak, todayISO, habitColor, habitLight, normalizeWA } from '@/lib/utils'
import { BadgeShelf } from '@/components/parent/BadgeShelf'
import { ChildSwitcher } from '@/components/parent/ChildSwitcher'
import { getChildren } from '@/lib/activeChild'
import { PushToggle } from '@/components/push/PushToggle'
import { ProgressRing } from '@/components/ui/ProgressRing'

export default async function BerandaPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('name, password_changed')
    .eq('id', user!.id)
    .single()

  const { children, active } = await getChildren(supabase, user!.id)
  const teacherWA = active?.teacherWA ?? null
  const teacherName = active?.teacherName ?? null
  const firstChild = active?.id
  let streak = 0
  let best = 0
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
    best = bestStreak(dates)
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
          {active && children.length > 1 ? (
            <ChildSwitcher items={children.map((c) => ({ id: c.id, name: c.name }))} activeId={active.id} />
          ) : null}
          <p className="text-sm font-medium opacity-85">Jurnal anak:</p>
          <h1 className="mb-4 text-xl font-black">
            {active?.name ?? profile?.name ?? 'Orang Tua Hebat'}
            {active?.className ? <span className="ml-2 text-sm font-semibold opacity-80">Kelas {active.className}</span> : null}
          </h1>

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
              <p className="text-xs font-medium opacity-80">Hari ini</p>
              <p className="font-display text-base font-black">
                {doneCount}/{habitTotal} kebiasaan
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium opacity-80">Berturut</p>
              <p className="font-display text-lg font-black text-brand-yellow">🔥 {streak}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-5 py-5">
        {profile && !profile.password_changed && (
          <Link
            href="/profil/ganti-password"
            className="mb-4 flex items-center gap-3 rounded-card border border-amber-200 bg-amber-50 p-4"
          >
            <span className="text-2xl">🔑</span>
            <span className="flex-1 text-sm text-amber-900">
              <b>Password Anda masih NIS anak.</b> Ketuk di sini untuk menggantinya.
            </span>
          </Link>
        )}

        {children.length === 0 ? (
          <div className="rounded-card bg-white p-6 text-center shadow-soft">
            <p className="text-base text-ink-2">Akun belum terhubung ke data anak.</p>
            <p className="mt-1 text-sm text-ink-3">Silakan hubungi wali kelas.</p>
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
                <p className="font-display text-lg font-black">
                  {todayDone ? 'Jurnal hari ini sudah diisi ✓' : 'Isi Jurnal Hari Ini'}
                </p>
                <p className="text-sm opacity-85">
                  {todayDone ? 'Ketuk untuk melihat / ubah' : 'Yuk lengkapi 7 kebiasaan anak'}
                </p>
              </div>
              <span className="text-3xl">{todayDone ? '✅' : '📝'}</span>
            </Link>

            <div className="mb-5">
              <BadgeShelf best={best} current={streak} compact />
            </div>

            <div className="mb-5 empty:hidden">
              <PushToggle hideWhenOn />
            </div>

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
                    <span className="flex-1 text-base font-semibold text-ink">{h.name}</span>
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-bold"
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

            {/* Kontak Wali Kelas */}
            {teacherWA && (
              <div className="mt-5 rounded-[12px] border border-line bg-white p-4 shadow-row">
                <p className="mb-0.5 text-xs font-bold uppercase tracking-wide text-ink-3">Wali Kelas</p>
                <p className="mb-2 text-sm font-semibold text-ink">{teacherName ?? 'Guru'}</p>
                <a
                  href={`https://wa.me/${normalizeWA(teacherWA)}?text=${encodeURIComponent(`Halo Pak/Bu ${teacherName ?? 'Guru'}, saya orang tua dari ${active?.name ?? 'siswa'}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-btn bg-emerald-600 px-5 py-3 text-base font-bold text-white"
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

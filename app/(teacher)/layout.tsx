import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/ui/LogoutButton'
import { ExpiredGate } from '@/components/ui/ExpiredGate'
import { themeVars } from '@/lib/theme'
import TeacherNav from './TeacherNav'

function daysLeft(until: string | null): number | null {
  if (!until) return null
  return Math.ceil((new Date(until).getTime() - Date.now()) / 86400000)
}

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, name, schools(name, plan, active_until, logo_url, theme_color)')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'teacher') redirect('/login')

  const school = profile?.schools as unknown as {
    name: string
    plan: string
    active_until: string
    logo_url: string | null
    theme_color: string | null
  } | null

  const days = daysLeft(school?.active_until ?? null)
  const isExpired = days !== null && days <= 0
  const isTrial = school?.plan === 'trial'
  const showBanner = isExpired || (isTrial && days !== null && days <= 3)

  return (
    <div className="mx-auto min-h-dvh max-w-3xl bg-bg pb-10" style={themeVars(school?.theme_color)}>
      <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-3">
        {school?.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={school.logo_url} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-contain" />
        )}
        <div className="min-w-0 flex-1">
          <Link href="/teacher-dashboard" className="font-display text-base font-black text-brand-blue">
            Panel Guru
          </Link>
          {school?.name && (
            <p className="truncate text-xs text-ink-3">{school.name}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isTrial && !isExpired && days !== null && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
              Trial {days} hari
            </span>
          )}
          <LogoutButton compact />
        </div>
      </div>

      {showBanner && (
        <div className={`px-5 py-3 text-center text-sm font-semibold ${isExpired ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
          {isExpired
            ? 'Masa aktif sudah habis. '
            : `Masa trial tinggal ${days} hari. `}
          <Link href="/pengaturan" className="underline font-bold">
            Upgrade ke Pro →
          </Link>
        </div>
      )}

      <TeacherNav />
      <ExpiredGate
        expired={isExpired}
        allowPrefix="/pengaturan"
        title="Masa aktif habis"
        message="Data Anda aman. Masukkan kode lisensi untuk lanjut memakai aplikasi."
        action={{ href: '/pengaturan', label: 'Masukkan Kode Lisensi' }}
      >
        {children}
      </ExpiredGate>
    </div>
  )
}

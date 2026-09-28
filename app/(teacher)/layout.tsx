import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/ui/LogoutButton'
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
    .select('role, name, schools(name, plan, active_until)')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'teacher') redirect('/login')

  const school = profile?.schools as unknown as {
    name: string
    plan: string
    active_until: string
  } | null

  const days = daysLeft(school?.active_until ?? null)
  const isExpired = days !== null && days <= 0
  const isTrial = school?.plan === 'trial'
  const showBanner = isExpired || (isTrial && days !== null && days <= 3)

  return (
    <div className="mx-auto min-h-dvh max-w-3xl bg-bg pb-10">
      <div className="flex items-center justify-between border-b border-line bg-white px-5 py-3">
        <div>
          <Link href="/teacher-dashboard" className="font-display text-sm font-black text-brand-blue">
            Panel Guru
          </Link>
          {school?.name && (
            <p className="text-[10px] text-ink-3">{school.name}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isTrial && !isExpired && days !== null && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
              Trial {days}h
            </span>
          )}
          <LogoutButton compact />
        </div>
      </div>

      {showBanner && (
        <div className={`px-5 py-3 text-sm font-semibold text-center ${isExpired ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
          {isExpired
            ? 'Trial habis. '
            : `Trial berakhir dalam ${days} hari. `}
          <Link href="/pengaturan" className="underline font-bold">
            Upgrade ke Pro →
          </Link>
        </div>
      )}

      <TeacherNav />
      {children}
    </div>
  )
}

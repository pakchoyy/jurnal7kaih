import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/ui/LogoutButton'
import TeacherNav from './TeacherNav'

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
        <LogoutButton compact />
      </div>
      <TeacherNav />
      {children}
    </div>
  )
}

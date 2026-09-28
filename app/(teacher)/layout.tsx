import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/ui/LogoutButton'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'teacher') redirect('/login')

  return (
    <div className="mx-auto min-h-dvh max-w-3xl bg-bg pb-10">
      <div className="flex items-center justify-between border-b border-line bg-white px-5 py-3">
        <Link href="/teacher-dashboard" className="font-display text-sm font-black text-brand-blue">
          Panel Guru
        </Link>
        <div className="w-auto">
          <LogoutButton compact />
        </div>
      </div>
      {children}
    </div>
  )
}

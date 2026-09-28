import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AdminNav } from './AdminNav'
import LogoutButton from '@/components/ui/LogoutButton'

export default async function SchoolAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, name, schools(name)')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'school_admin') redirect('/login')

  const schoolName =
    (profile?.schools as unknown as { name: string } | null)?.name ?? 'Sekolah'

  return (
    <div className="mx-auto min-h-dvh max-w-4xl bg-bg pb-10">
      <header className="flex items-center justify-between bg-grad-blue px-5 py-4 text-white">
        <div>
          <p className="text-[11px] opacity-75">Panel Admin Sekolah</p>
          <h1 className="font-display text-base font-black">{schoolName}</h1>
        </div>
        <LogoutButton compact />
      </header>
      <AdminNav />
      {children}
    </div>
  )
}

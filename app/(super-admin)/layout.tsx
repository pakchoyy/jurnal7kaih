import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient, getUserCached } from '@/lib/supabase/server'
import LogoutButton from '@/components/ui/LogoutButton'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await getUserCached()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'super_admin') redirect('/login')

  return (
    <div className="mx-auto min-h-dvh max-w-4xl bg-bg pb-10">
      <header className="flex items-center justify-between bg-grad-purple px-5 py-4 text-white">
        <div>
          <p className="text-[11px] opacity-75">Super Admin</p>
          <h1 className="font-display text-base font-black">Kelola Sekolah</h1>
        </div>
        <LogoutButton compact />
      </header>
      <nav className="flex gap-1 border-b border-line bg-white px-3">
        <Link prefetch={false} href="/sekolah" className="border-b-2 border-brand-blue px-3 py-3 text-sm font-semibold text-brand-blue">
          Sekolah
        </Link>
        <Link prefetch={false} href="/lisensi" className="border-b-2 border-transparent px-3 py-3 text-sm font-semibold text-ink-3 hover:text-ink-2">
          Lisensi
        </Link>
      </nav>
      {children}
    </div>
  )
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

const nav = [
  { href: '/admin-dashboard', label: 'Dashboard' },
  { href: '/kelas', label: 'Kelas' },
  { href: '/siswa', label: 'Siswa' },
  { href: '/guru', label: 'Guru' },
  { href: '/kode-aktivasi', label: 'Kode Aktivasi' },
]

export default async function SchoolAdminLayout({ children }: { children: React.ReactNode }) {
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
  if (profile?.role !== 'school_admin') redirect('/login')

  return (
    <div className="mx-auto min-h-dvh max-w-4xl bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-5 py-4">
        <h1 className="font-black text-brand-blue">Panel Admin Sekolah</h1>
        <p className="text-xs text-gray-500">{profile?.name}</p>
      </header>
      <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-3">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="whitespace-nowrap px-3 py-3 text-sm font-medium text-gray-500 hover:text-brand-blue"
          >
            {n.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}

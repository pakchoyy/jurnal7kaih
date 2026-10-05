import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/ui/BottomNav'
import { AppHeader } from '@/components/ui/AppHeader'
import { ExpiredGate } from '@/components/ui/ExpiredGate'
import { BILLING_ENABLED } from '@/lib/billing'
import { themeVars } from '@/lib/theme'

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, schools(name, logo_url, active_until, theme_color)')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'parent') redirect('/login')

  const school = profile.schools as unknown as {
    name: string
    logo_url: string | null
    active_until: string | null
    theme_color: string | null
  } | null
  const activeUntil = school?.active_until
  const expired = !activeUntil || new Date(activeUntil).getTime() <= Date.now()

  return (
    <div className="min-h-dvh bg-bg pb-24" style={themeVars(school?.theme_color)}>
      <AppHeader
        title={school?.name ?? 'SiHebat'}
        subtitle="SiHebat · Jurnal Digital 7 Kebiasaan Anak"
        logoUrl={school?.logo_url}
        homeHref="/beranda"
        menu={[
          { href: '/beranda', label: 'Beranda', icon: 'home' },
          { href: '/jurnal/isi', label: 'Isi Jurnal Hari Ini', icon: 'edit' },
          { href: '/jurnal', label: 'Daftar Jurnal', icon: 'list' },
          { href: '/riwayat', label: 'Progres & Lencana', icon: 'badge' },
          { href: '/profil/tambah-anak', label: 'Tambah Kakak / Adik', icon: 'family' },
          { href: '/profil', label: 'Profil & Pengaturan', icon: 'settings' },
        ]}
      />
      <div className="mx-auto max-w-lg">
      <ExpiredGate
        expired={BILLING_ENABLED && expired}
        allowPrefix="/profil"
        title="Aplikasi sedang tidak aktif"
        message="Langganan sekolah sudah berakhir. Silakan hubungi wali kelas."
      >
        {children}
      </ExpiredGate>
      </div>
      <BottomNav
        items={[
          { href: '/beranda', label: 'Beranda', icon: 'home' },
          { href: '/jurnal', label: 'Jurnal', icon: 'journal' },
          { href: '/riwayat', label: 'Progres', icon: 'chart' },
          { href: '/profil', label: 'Profil', icon: 'user' },
        ]}
      />
    </div>
  )
}

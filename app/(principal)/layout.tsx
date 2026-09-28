import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/ui/AppHeader'
import { themeVars } from '@/lib/theme'

export default async function PrincipalLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, name, schools(name, logo_url, theme_color)')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'principal') redirect('/login')

  const school = profile.schools as unknown as { name: string; logo_url: string | null; theme_color: string | null } | null

  return (
    <div className="min-h-dvh bg-bg pb-10" style={themeVars(school?.theme_color)}>
      <AppHeader
        title={school?.name ?? 'Jurnal 7KAIH'}
        subtitle={`Kepala Sekolah · ${profile.name}`}
        logoUrl={school?.logo_url}
        homeHref="/kepsek"
        menu={[{ href: '/kepsek', label: 'Rekap Sekolah', icon: 'chart' }]}
      />
      <div className="mx-auto max-w-3xl">{children}</div>
    </div>
  )
}

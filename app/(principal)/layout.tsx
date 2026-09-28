import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/ui/LogoutButton'
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
    <div className="mx-auto min-h-dvh max-w-3xl bg-bg pb-10" style={themeVars(school?.theme_color)}>
      <div className="flex items-center gap-3 border-b border-line bg-white px-5 py-3">
        {school?.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={school.logo_url} alt="" className="h-10 w-10 rounded-lg object-contain" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-black text-brand-blue">Kepala Sekolah</p>
          <p className="truncate text-xs text-ink-3">{school?.name}</p>
        </div>
        <LogoutButton compact />
      </div>
      {children}
    </div>
  )
}

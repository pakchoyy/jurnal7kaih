import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PengaturanClient from './PengaturanClient'
import TampilanSekolah from './TampilanSekolah'

export default async function PengaturanPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, whatsapp, school_id, schools(name, plan, active_until, logo_url, theme_color)')
    .eq('id', user.id)
    .single()

  const school = profile?.schools as unknown as {
    name: string
    plan: string
    active_until: string
    logo_url: string | null
    theme_color: string | null
  } | null

  return (
    <PengaturanClient
      whatsapp={profile?.whatsapp ?? ''}
      plan={school?.plan ?? 'trial'}
      activeUntil={school?.active_until ?? null}
      tampilan={
        <TampilanSekolah
          schoolName={school?.name ?? ''}
          logoUrl={school?.logo_url ?? null}
          themeColor={school?.theme_color ?? 'blue'}
        />
      }
    />
  )
}

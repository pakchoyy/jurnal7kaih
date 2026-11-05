import { createServerClient, getProfileCached, getUserCached } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PengaturanClient from './PengaturanClient'
import TampilanSekolah from './TampilanSekolah'
import TahunAjaranCard from './TahunAjaranCard'

export default async function PengaturanPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await getUserCached()
  if (!user) redirect('/login')

  const profile = await getProfileCached()

  const school = profile?.schools as unknown as {
    name: string
    plan: string
    active_until: string
    logo_url: string | null
    theme_color: string | null
  } | null

  const { data: ay } = await supabase
    .from('academic_years')
    .select('name')
    .eq('school_id', profile?.school_id ?? '')
    .eq('is_active', true)
    .maybeSingle()

  return (
    <PengaturanClient
      whatsapp={profile?.whatsapp ?? ''}
      plan={school?.plan ?? 'trial'}
      activeUntil={school?.active_until ?? null}
      tampilan={
        <>
        <TahunAjaranCard current={ay?.name ?? null} />
        <TampilanSekolah
          schoolName={school?.name ?? ''}
          logoUrl={school?.logo_url ?? null}
          themeColor={school?.theme_color ?? 'blue'}
        />
        </>
      }
    />
  )
}

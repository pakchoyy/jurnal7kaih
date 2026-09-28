import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PengaturanClient from './PengaturanClient'

export default async function PengaturanPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, whatsapp, school_id, schools(plan, active_until)')
    .eq('id', user.id)
    .single()

  const school = profile?.schools as unknown as { plan: string; active_until: string } | null

  return (
    <PengaturanClient
      whatsapp={profile?.whatsapp ?? ''}
      plan={school?.plan ?? 'trial'}
      activeUntil={school?.active_until ?? null}
    />
  )
}

import { createServerClient, getUserCached } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import LisensiClient from './LisensiClient'

export default async function LisensiPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await getUserCached()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'super_admin') redirect('/login')

  const admin = createAdminClient()
  const { data: keys } = await admin
    .from('license_keys')
    .select('key, plan, used_at, used_by_school_id')
    .order('created_at', { ascending: false })
    .limit(100)

  return <LisensiClient keys={keys ?? []} />
}

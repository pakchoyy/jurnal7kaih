import { getProfileCached, getUserCached } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import LisensiClient from './LisensiClient'

export default async function LisensiPage() {
  const {
    data: { user },
  } = await getUserCached()
  if (!user) redirect('/login')

  const profile = await getProfileCached()
  if (profile?.role !== 'super_admin') redirect('/login')

  const admin = createAdminClient()
  const { data: keys } = await admin
    .from('license_keys')
    .select('key, plan, used_at, used_by_school_id')
    .order('created_at', { ascending: false })
    .limit(100)

  return <LisensiClient keys={keys ?? []} />
}

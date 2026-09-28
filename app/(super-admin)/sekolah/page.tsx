import { createServerClient } from '@/lib/supabase/server'
import { SekolahClient } from './SekolahClient'

export default async function SekolahPage() {
  const supabase = createServerClient()

  const { data: schools } = await supabase
    .from('schools')
    .select('id, name, code, phone, status, plan, active_until, buyer_email, created_at')
    .order('created_at', { ascending: false })

  return <SekolahClient schools={(schools ?? []) as any[]} />
}

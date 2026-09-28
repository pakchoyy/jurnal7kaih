import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getRoleRedirect } from '@/lib/utils'

export default async function Home() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  redirect(getRoleRedirect(profile?.role))
}

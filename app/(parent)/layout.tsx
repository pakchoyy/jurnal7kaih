import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/ui/BottomNav'

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
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
  if (profile?.role !== 'parent') redirect('/login')

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-gray-50 pb-20">
      {children}
      <BottomNav />
    </div>
  )
}

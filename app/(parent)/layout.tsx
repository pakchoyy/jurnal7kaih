import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/ui/BottomNav'
import { ExpiredGate } from '@/components/ui/ExpiredGate'

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, schools(active_until)')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'parent') redirect('/login')

  const activeUntil = (profile.schools as unknown as { active_until: string | null } | null)?.active_until
  const expired = !activeUntil || new Date(activeUntil).getTime() <= Date.now()

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-bg pb-24">
      <ExpiredGate
        expired={expired}
        allowPrefix="/profil"
        title="Aplikasi sedang tidak aktif"
        message="Langganan sekolah sudah berakhir. Silakan hubungi wali kelas."
      >
        {children}
      </ExpiredGate>
      <BottomNav />
    </div>
  )
}

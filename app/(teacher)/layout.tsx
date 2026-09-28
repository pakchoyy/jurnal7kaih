import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
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
  if (profile?.role !== 'teacher') redirect('/login')

  return (
    <div className="mx-auto min-h-dvh max-w-3xl bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-5 py-4">
        <h1 className="font-black text-brand-blue">Panel Guru</h1>
      </header>
      {children}
    </div>
  )
}

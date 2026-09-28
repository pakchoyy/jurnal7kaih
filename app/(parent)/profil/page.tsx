import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/ui/LogoutButton'

export default async function ProfilPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('name, email, role')
    .eq('id', user!.id)
    .single()

  const { data: links } = await supabase
    .from('student_parents')
    .select('student_id, relationship, students(name)')
    .eq('user_id', user!.id)

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-black text-brand-blue">Profil</h1>

      <div className="mt-4 rounded-card bg-white p-4 shadow-sm">
        <p className="font-bold">{profile?.name ?? 'Orang Tua'}</p>
        <p className="text-sm text-gray-500">{profile?.email}</p>
      </div>

      <div className="mt-4 rounded-card bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-gray-500">Anak terhubung</p>
        {(links ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada anak.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(links ?? []).map((l: any) => (
              <li key={l.student_id} className="flex items-center justify-between">
                <span className="font-medium">
                  {(l.students as unknown as { name: string } | null)?.name ?? 'Siswa'}
                </span>
                <span className="text-xs text-gray-400">{l.relationship}</span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/profil/tambah-anak"
          className="mt-3 block rounded-btn bg-brand-blue py-2.5 text-center text-sm font-semibold text-white"
        >
          + Tambah Anak
        </Link>
      </div>

      <div className="mt-4">
        <LogoutButton />
      </div>
    </div>
  )
}

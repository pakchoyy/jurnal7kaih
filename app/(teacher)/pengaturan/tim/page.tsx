import Link from 'next/link'
import { createServerClient, getUserCached } from '@/lib/supabase/server'
import TimClient from './TimClient'

export default async function TimPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await getUserCached()
  const { data: me } = await supabase.from('users').select('school_id').eq('id', user!.id).single()

  const { data: members } = await supabase
    .from('users')
    .select('id, name, email, role, status')
    .eq('school_id', me?.school_id ?? '')
    .in('role', ['teacher', 'principal'])
    .order('role')
    .order('name')

  return (
    <div className="px-5 py-5">
      <Link prefetch={false} href="/pengaturan" className="mb-2 inline-block py-1 text-sm font-semibold text-brand-blue">
        ← Pengaturan
      </Link>
      <h1 className="font-display text-xl font-black text-ink">Guru & Kepala Sekolah</h1>
      <p className="mb-5 mt-1 text-sm text-ink-2">
        Tambah guru lain di sekolah yang sama (tidak perlu daftar trial lagi) dan akun kepala sekolah untuk melihat rekap
        semua kelas.
      </p>
      <TimClient members={members ?? []} myId={user!.id} />
    </div>
  )
}

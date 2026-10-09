import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerClient, getUserCached } from '@/lib/supabase/server'
import EditKelasForm from './EditKelasForm'

export default async function EditKelasPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await getUserCached()
  if (!user) redirect('/login')

  const { data: kelas } = await supabase
    .from('classes')
    .select('id, name, grade')
    .eq('id', params.id)
    .eq('homeroom_teacher_id', user.id)
    .single()

  if (!kelas) notFound()

  return (
    <div className="px-5 py-5">
      <div className="mb-5 flex items-center gap-3">
        <Link prefetch={false} href={`/kelas/${params.id}`} className="py-2 text-sm font-semibold text-brand-blue">
          ← Kembali
        </Link>
        <h1 className="font-display text-lg font-black text-ink">Ubah Kelas {kelas.name}</h1>
      </div>

      <EditKelasForm classId={kelas.id} initialName={kelas.name} initialGrade={kelas.grade} />
    </div>
  )
}

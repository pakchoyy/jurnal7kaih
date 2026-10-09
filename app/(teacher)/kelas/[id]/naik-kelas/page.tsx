import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import NaikKelasForm from './NaikKelasForm'

export default async function NaikKelasPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: kelas } = await supabase
    .from('classes')
    .select('id, name, grade')
    .eq('id', params.id)
    .eq('homeroom_teacher_id', user!.id)
    .maybeSingle()
  if (!kelas) notFound()

  const [{ data: students }, { data: others }] = await Promise.all([
    supabase.from('students').select('id, name, student_number').eq('class_id', kelas.id).eq('status', 'active').order('name'),
    supabase
      .from('classes')
      .select('id, name, grade, academic_years(name, is_active)')
      .eq('homeroom_teacher_id', user!.id)
      .neq('id', kelas.id)
      .order('grade'),
  ])

  const targets = (others ?? []).map((c) => {
    const ay = c.academic_years as unknown as { name: string; is_active: boolean } | null
    return { id: c.id, label: `Kelas ${c.name} (${ay?.name ?? '-'})`, active: !!ay?.is_active }
  })

  return (
    <div className="px-5 py-5">
      <Link prefetch={false} href={`/kelas/${kelas.id}`} className="mb-2 inline-block py-1 text-sm font-semibold text-brand-blue">
        ← Kelas {kelas.name}
      </Link>
      <h1 className="font-display text-xl font-black text-ink">Naik Kelas / Pindah / Lulus</h1>
      <p className="mb-5 mt-1 text-sm text-ink-2">
        Pindahkan siswa ke kelas lain. Riwayat jurnal dan akun orang tua tetap tersimpan.
      </p>
      <NaikKelasForm
        classId={kelas.id}
        nextGrade={Math.min(kelas.grade + 1, 12)}
        students={students ?? []}
        targets={targets.sort((a, b) => Number(b.active) - Number(a.active))}
      />
    </div>
  )
}

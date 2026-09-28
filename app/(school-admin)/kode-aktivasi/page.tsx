import { createServerClient } from '@/lib/supabase/server'
import { KodeAktivasiClient } from './KodeAktivasiClient'

export default async function KodeAktivasiPage() {
  const supabase = createServerClient()

  const { data: students } = await supabase
    .from('students')
    .select('id, name, classes(name)')
    .eq('status', 'active')
    .order('name')

  const { data: codes } = await supabase
    .from('parent_activation_codes')
    .select('id, code, used_at, expires_at, students(name)')
    .order('created_at', { ascending: false })
    .limit(50)

  const studentOptions = ((students ?? []) as any[]).map((s) => ({
    id: s.id,
    name: s.name,
    class_name: (s.classes as unknown as { name: string } | null)?.name ?? null,
  }))

  const codeRows = ((codes ?? []) as any[]).map((c) => ({
    id: c.id,
    code: c.code,
    student_name: (c.students as unknown as { name: string } | null)?.name ?? 'Siswa',
    used_at: c.used_at,
    expires_at: c.expires_at,
  }))

  return (
    <div className="px-5 py-5">
      <h1 className="mb-4 font-display text-lg font-black text-ink">Kode Aktivasi Orang Tua</h1>
      <KodeAktivasiClient students={studentOptions} codes={codeRows} />
    </div>
  )
}

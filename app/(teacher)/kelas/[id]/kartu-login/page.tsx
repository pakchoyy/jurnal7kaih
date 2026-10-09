import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PrintButton } from '@/app/rapor/[studentId]/PrintButton'

export default async function KartuLoginPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: kelas } = await supabase
    .from('classes')
    .select('id, name, schools(name)')
    .eq('id', params.id)
    .eq('homeroom_teacher_id', user!.id)
    .maybeSingle()
  if (!kelas) notFound()

  const { data: students } = await supabase
    .from('students')
    .select('id, name, student_number')
    .eq('class_id', kelas.id)
    .eq('status', 'active')
    .order('name')

  const schoolName = (kelas.schools as unknown as { name: string } | null)?.name ?? ''
  const host = headers().get('host') ?? ''
  const appUrl = host ? `${host.startsWith('localhost') ? 'http' : 'https'}://${host}` : ''

  return (
    <div className="px-5 py-5">
      <div className="no-print mb-4 flex flex-wrap items-center gap-3">
        <Link prefetch={false} href={`/kelas/${kelas.id}`} className="py-2 text-sm font-semibold text-brand-blue">
          ← Kelas {kelas.name}
        </Link>
        <div className="ml-auto">
          <PrintButton />
        </div>
      </div>
      <p className="no-print mb-4 text-sm text-ink-2">
        Cetak lalu gunting, bagikan ke orang tua. Orang tua cukup memasukkan NIS, tanpa password.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 print:grid-cols-2">
        {(students ?? []).map((s) => (
          <div key={s.id} className="break-inside-avoid rounded-card border-2 border-dashed border-line bg-white p-4">
            <p className="text-xs font-semibold text-ink-3">
              {schoolName} · Kelas {kelas.name}
            </p>
            <p className="mt-1 font-display text-lg font-black text-ink">{s.name}</p>
            <div className="mt-2 rounded-btn bg-bg p-3 text-sm">
              <p>
                Buka: <b>{appUrl || 'aplikasi SiHebat'}</b>
              </p>
              <p>
                Pilih tab: <b>Orang Tua</b>
              </p>
              <p>
                NIS: <b className="font-mono text-base">{s.student_number}</b>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

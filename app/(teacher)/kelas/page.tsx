import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'

export default async function KelasPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, grade, students(count), academic_years(name, is_active)')
    .eq('homeroom_teacher_id', user!.id)
    .order('grade')
    .order('name')

  return (
    <div className="px-5 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-lg font-black text-ink">Kelas Saya</h1>
        <Link
          href="/kelas/buat"
          className="rounded-btn bg-brand-blue px-3.5 py-2 text-xs font-bold text-white"
        >
          + Buat Kelas
        </Link>
      </div>

      {!classes || classes.length === 0 ? (
        <div className="rounded-card bg-white p-8 text-center shadow-soft">
          <p className="text-sm text-ink-2">Belum ada kelas.</p>
          <p className="mt-1 text-xs text-ink-3">Buat kelas pertama untuk mulai input siswa.</p>
          <Link
            href="/kelas/buat"
            className="mt-4 inline-block rounded-btn bg-brand-blue px-5 py-2.5 text-sm font-bold text-white"
          >
            Buat Kelas Pertama
          </Link>
        </div>
      ) : (
        <>
        {[true, false].map((isActive) => {
          const group = classes.filter((c: any) => !!c.academic_years?.is_active === isActive)
          if (group.length === 0) return null
          return (
            <div key={String(isActive)} className="mb-5">
              {!isActive && (
                <p className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink-3">Tahun ajaran lalu</p>
              )}
        <ul className="stagger flex flex-col gap-3">
          {group.map((c: any) => {
            const studentCount = Array.isArray(c.students) ? c.students[0]?.count ?? 0 : 0
            return (
              <li key={c.id}>
                <Link
                  href={`/kelas/${c.id}`}
                  className="flex items-center gap-3 pressable rounded-card bg-white p-4 shadow-soft"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue-light font-display text-base font-black text-brand-blue">
                    {c.name}
                  </span>
                  <div className="flex-1">
                    <p className="font-display text-base font-extrabold text-ink">Kelas {c.name}</p>
                    <p className="text-sm text-ink-3">
                      Tingkat {c.grade} · {c.academic_years?.name ?? ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-ink-2">
                    {studentCount} siswa
                  </span>
                  <span className="text-ink-3">›</span>
                </Link>
              </li>
            )
          })}
        </ul>
            </div>
          )
        })}
        </>
      )}
    </div>
  )
}

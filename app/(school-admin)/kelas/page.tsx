import { createServerClient } from '@/lib/supabase/server'
import { initials } from '@/lib/utils'

export default async function KelasPage() {
  const supabase = createServerClient()

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, grade, academic_years(name), users(name), students(count)')
    .order('grade')
    .order('name')

  return (
    <div className="px-5 py-5">
      <h1 className="mb-4 font-display text-lg font-black text-ink">Kelas</h1>

      {!classes || classes.length === 0 ? (
        <div className="rounded-card bg-white p-6 text-center text-sm text-ink-3 shadow-soft">
          Belum ada kelas.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {classes.map((c: any) => {
            const studentCount = Array.isArray(c.students) ? c.students[0]?.count ?? 0 : 0
            const homeroomName =
              (c.users as unknown as { name: string } | null)?.name ?? null
            const academicYearName =
              (c.academic_years as unknown as { name: string } | null)?.name ?? '-'
            return (
              <li key={c.id} className="rounded-card bg-white p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue-light font-display text-sm font-black text-brand-blue">
                    {c.name}
                  </span>
                  <div className="flex-1">
                    <p className="font-display text-sm font-extrabold text-ink">Kelas {c.name}</p>
                    <p className="text-[11px] text-ink-3">
                      Tingkat {c.grade} · {academicYearName}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-ink-2">
                    {studentCount} siswa
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                  {homeroomName ? (
                    <>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal text-[10px] font-bold text-white">
                        {initials(homeroomName)}
                      </span>
                      <span className="text-xs text-ink-2">
                        Wali kelas: <strong className="text-ink">{homeroomName}</strong>
                      </span>
                    </>
                  ) : (
                    <span className="text-xs italic text-ink-3">Wali kelas belum ditentukan</span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

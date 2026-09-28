import { createServerClient } from '@/lib/supabase/server'

export default async function KelasPage() {
  const supabase = createServerClient()

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, grade, academic_years(name), users(name), students(count)')
    .order('grade')
    .order('name')

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-black text-brand-blue">Kelas</h1>

      {!classes || classes.length === 0 ? (
        <p className="mt-5 text-gray-500">Belum ada kelas.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {classes.map((c: any) => {
            const studentCount = Array.isArray(c.students) ? c.students[0]?.count ?? 0 : 0
            const homeroomName =
              (c.users as unknown as { name: string } | null)?.name ?? 'Belum ditentukan'
            const academicYearName =
              (c.academic_years as unknown as { name: string } | null)?.name ?? '-'
            return (
              <li key={c.id} className="rounded-card bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{c.name}</span>
                  <span className="text-xs text-gray-400">Tingkat {c.grade}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">Wali kelas: {homeroomName}</p>
                <p className="text-xs text-gray-400">
                  {studentCount} siswa · {academicYearName}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

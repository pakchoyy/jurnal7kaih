import { createServerClient } from '@/lib/supabase/server'
import { initials } from '@/lib/utils'

export default async function SiswaPage() {
  const supabase = createServerClient()

  const { data: students } = await supabase
    .from('students')
    .select('id, name, student_number, nisn, gender, status, classes(name)')
    .order('name')

  return (
    <div className="px-5 py-5">
      <h1 className="mb-4 font-display text-lg font-black text-ink">Siswa</h1>

      {!students || students.length === 0 ? (
        <div className="rounded-card bg-white p-6 text-center text-sm text-ink-3 shadow-soft">
          Belum ada siswa.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {students.map((s: any) => {
            const className = (s.classes as unknown as { name: string } | null)?.name ?? '-'
            return (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-[12px] bg-white px-3.5 py-3 shadow-row"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-blue text-[11px] font-bold text-white">
                  {initials(s.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-extrabold text-ink">{s.name}</p>
                  <p className="text-[11px] text-ink-3">
                    NIS {s.student_number ?? '-'} · Kelas {className}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    s.status === 'active'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-100 text-ink-3'
                  }`}
                >
                  {s.status === 'active' ? 'Aktif' : 'Nonaktif'}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { initials } from '@/lib/utils'

export default async function SiswaPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Ambil semua kelas guru ini
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('homeroom_teacher_id', user!.id)

  const classIds = (classes ?? []).map((c) => c.id)
  const classMap: Record<string, string> = {}
  for (const c of classes ?? []) classMap[c.id] = c.name

  const { data: students } = classIds.length
    ? await supabase
        .from('students')
        .select('id, name, student_number, gender, status, class_id')
        .in('class_id', classIds)
        .order('name')
    : { data: [] }

  return (
    <div className="px-5 py-5">
      <h1 className="mb-4 font-display text-lg font-black text-ink">
        Semua Siswa ({students?.length ?? 0})
      </h1>

      {!students || students.length === 0 ? (
        <div className="rounded-card bg-white p-6 text-center text-sm text-ink-3 shadow-soft">
          Belum ada siswa. Tambahkan lewat menu Kelas.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {students.map((s) => (
            <li key={s.id}>
              <Link
                href={`/siswa/${s.id}`}
                className="flex items-center gap-3 rounded-[12px] bg-white px-3.5 py-3 shadow-row"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-blue text-[11px] font-bold text-white">
                  {initials(s.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-extrabold text-ink">{s.name}</p>
                  <p className="text-[11px] text-ink-3">
                    NIS {s.student_number ?? '-'} · Kelas {classMap[s.class_id ?? ''] ?? '-'}
                  </p>
                </div>
                <span className="text-ink-3">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

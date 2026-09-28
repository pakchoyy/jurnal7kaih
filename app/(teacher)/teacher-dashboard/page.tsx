import { createServerClient } from '@/lib/supabase/server'
import { todayISO } from '@/lib/utils'

export default async function TeacherDashboard() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Kelas yang diampu (wali kelas)
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, grade')
    .eq('homeroom_teacher_id', user!.id)

  const classIds = (classes ?? []).map((c) => c.id)

  const { data: students } = classIds.length
    ? await supabase
        .from('students')
        .select('id, name, class_id')
        .in('class_id', classIds)
        .eq('status', 'active')
        .order('name')
    : { data: [] }

  const studentIds = (students ?? []).map((s) => s.id)
  const { data: todayJournals } = studentIds.length
    ? await supabase
        .from('journals')
        .select('student_id, status')
        .in('student_id', studentIds)
        .eq('journal_date', todayISO())
        .neq('status', 'draft')
    : { data: [] }

  const submittedSet = new Set((todayJournals ?? []).map((j) => j.student_id))

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-black text-brand-blue">Rekap Kelas Hari Ini</h1>
      <p className="mt-1 text-sm text-gray-500">
        {classes?.map((c) => c.name).join(', ') || 'Belum ada kelas yang diampu'}
      </p>

      {!students || students.length === 0 ? (
        <p className="mt-5 text-gray-500">Belum ada siswa di kelas Anda.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-2">
          {students.map((s) => {
            const done = submittedSet.has(s.id)
            return (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-card bg-white p-4 shadow-sm"
              >
                <span className="font-medium">{s.name}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    done ? 'bg-brand-green/15 text-brand-green' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {done ? 'Sudah mengisi' : 'Belum'}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

import { createServerClient } from '@/lib/supabase/server'
import { todayISO } from '@/lib/utils'

export default async function SchoolAdminDashboard() {
  const supabase = createServerClient()

  const [{ count: studentCount }, { count: classCount }, { count: teacherCount }] =
    await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('classes').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    ])

  const { count: todayCount } = await supabase
    .from('journals')
    .select('*', { count: 'exact', head: true })
    .eq('journal_date', todayISO())
    .neq('status', 'draft')

  const stats = [
    { label: 'Siswa aktif', value: studentCount ?? 0, color: 'text-brand-blue' },
    { label: 'Kelas', value: classCount ?? 0, color: 'text-brand-teal' },
    { label: 'Guru', value: teacherCount ?? 0, color: 'text-brand-yellow' },
    { label: 'Jurnal hari ini', value: todayCount ?? 0, color: 'text-brand-green' },
  ]

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-black text-brand-blue">Dashboard</h1>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-card bg-white p-4 shadow-sm">
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

import { createServerClient } from '@/lib/supabase/server'

export default async function SiswaPage() {
  const supabase = createServerClient()

  const { data: students } = await supabase
    .from('students')
    .select('id, name, student_number, nisn, gender, status, classes(name)')
    .order('name')

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-black text-brand-blue">Siswa</h1>

      {!students || students.length === 0 ? (
        <p className="mt-5 text-gray-500">Belum ada siswa.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-card bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 text-left text-xs text-gray-400">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">NIS</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any) => {
                const className = (s.classes as unknown as { name: string } | null)?.name ?? '-'
                return (
                  <tr key={s.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500">{s.student_number ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{className}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          s.status === 'active'
                            ? 'bg-brand-green/15 text-brand-green'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {s.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

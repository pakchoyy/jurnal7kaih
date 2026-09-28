import { createServerClient } from '@/lib/supabase/server'

export default async function SekolahPage() {
  const supabase = createServerClient()

  const { data: schools } = await supabase
    .from('schools')
    .select('id, name, code, phone, status, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-black text-brand-blue">Daftar Sekolah</h1>

      {!schools || schools.length === 0 ? (
        <p className="mt-5 text-gray-500">Belum ada sekolah terdaftar.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {schools.map((s) => (
            <li key={s.id} className="rounded-card bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold">{s.name}</span>
                <span className="font-mono text-xs text-gray-400">{s.code}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{s.phone ?? '-'}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

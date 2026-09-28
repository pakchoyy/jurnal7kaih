import { createServerClient } from '@/lib/supabase/server'

export default async function GuruPage() {
  const supabase = createServerClient()

  const { data: teachers } = await supabase
    .from('users')
    .select('id, name, email, phone, status')
    .eq('role', 'teacher')
    .order('name')

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-black text-brand-blue">Guru</h1>

      {!teachers || teachers.length === 0 ? (
        <p className="mt-5 text-gray-500">Belum ada guru.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {teachers.map((t) => (
            <li key={t.id} className="rounded-card bg-white p-4 shadow-sm">
              <p className="font-bold">{t.name}</p>
              <p className="text-sm text-gray-500">{t.email ?? '-'}</p>
              {t.phone && <p className="text-xs text-gray-400">{t.phone}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

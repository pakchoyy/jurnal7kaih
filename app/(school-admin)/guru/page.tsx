import { createServerClient } from '@/lib/supabase/server'
import { initials } from '@/lib/utils'

export default async function GuruPage() {
  const supabase = createServerClient()

  const { data: teachers } = await supabase
    .from('users')
    .select('id, name, email, phone, status')
    .eq('role', 'teacher')
    .order('name')

  return (
    <div className="px-5 py-5">
      <h1 className="mb-4 font-display text-lg font-black text-ink">Guru</h1>

      {!teachers || teachers.length === 0 ? (
        <div className="rounded-card bg-white p-6 text-center text-sm text-ink-3 shadow-soft">
          Belum ada guru.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {teachers.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-[12px] bg-white px-3.5 py-3 shadow-row"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-teal text-[11px] font-bold text-white">
                {initials(t.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-extrabold text-ink">{t.name}</p>
                <p className="truncate text-[11px] text-ink-3">{t.email ?? '-'}</p>
              </div>
              {t.phone && (
                <span className="text-[11px] text-ink-3">{t.phone}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

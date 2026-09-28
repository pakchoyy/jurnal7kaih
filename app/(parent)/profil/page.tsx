import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/ui/LogoutButton'
import { initials } from '@/lib/utils'

export default async function ProfilPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('name, email, role, schools(name)')
    .eq('id', user!.id)
    .single()

  const { data: links } = await supabase
    .from('student_parents')
    .select('student_id, relationship, students(name)')
    .eq('user_id', user!.id)

  const name = profile?.name ?? 'Orang Tua'
  const schoolName =
    (profile?.schools as unknown as { name: string } | null)?.name ?? null

  return (
    <div>
      <header className="bg-grad-teal px-5 pb-8 pt-6 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 font-display text-lg font-black backdrop-blur">
            {initials(name)}
          </span>
          <div>
            <h1 className="font-display text-lg font-black">{name}</h1>
            <p className="text-[11px] opacity-80">{profile?.email}</p>
          </div>
        </div>
      </header>

      <div className="px-5 py-5">
        {schoolName && (
          <div className="mb-4 rounded-card bg-white p-4 shadow-soft">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-3">Sekolah</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">{schoolName}</p>
          </div>
        )}

        <div className="rounded-card bg-white p-4 shadow-soft">
          <p className="mb-3 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
            Anak Terhubung
          </p>
          {(links ?? []).length === 0 ? (
            <p className="text-sm text-ink-3">Belum ada anak.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {(links ?? []).map((l: any) => {
                const childName =
                  (l.students as unknown as { name: string } | null)?.name ?? 'Siswa'
                return (
                  <li key={l.student_id} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue-light text-xs font-bold text-brand-blue">
                      {initials(childName)}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-ink">{childName}</span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-ink-2">
                      {l.relationship}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          <Link
            href="/profil/tambah-anak"
            className="mt-4 block rounded-btn bg-brand-blue py-2.5 text-center font-display text-sm font-extrabold text-white shadow-soft"
          >
            + Tambah Anak
          </Link>
        </div>

        <div className="mt-4">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}

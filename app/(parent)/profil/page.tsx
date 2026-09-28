import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/ui/LogoutButton'
import { initials } from '@/lib/utils'
import { InstallCard } from '@/components/pwa/InstallPrompt'
import { BigTextToggle } from '@/components/ui/BigTextToggle'

export default async function ProfilPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('name, role, schools(name)')
    .eq('id', user!.id)
    .single()

  const { data: links } = await supabase
    .from('student_parents')
    .select('student_id, relationship, students(name, student_number, classes(name))')
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
            <p className="text-sm opacity-90">Akun Orang Tua</p>
          </div>
        </div>
      </header>

      <div className="px-5 py-5">
        {schoolName && (
          <div className="mb-4 rounded-card bg-white p-4 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-3">Sekolah</p>
            <p className="mt-0.5 text-base font-semibold text-ink">{schoolName}</p>
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
                const st = l.students as {
                  name: string
                  student_number: string | null
                  classes: { name: string } | null
                } | null
                const childName = st?.name ?? 'Siswa'
                return (
                  <li key={l.student_id} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue-light text-xs font-bold text-brand-blue">
                      {initials(childName)}
                    </span>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-ink">{childName}</p>
                      <p className="text-sm text-ink-3">
                        NIS {st?.student_number ?? '-'}
                        {st?.classes?.name ? ` · Kelas ${st.classes.name}` : ''}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <Link
            href="/profil/tambah-anak"
            className="mt-4 block rounded-btn border-2 border-brand-blue/30 py-3 text-center text-base font-bold text-brand-blue"
          >
            + Tambah Kakak / Adik
          </Link>
        </div>

        <div className="mt-4">
          <BigTextToggle />
        </div>

        <div className="mt-4">
          <InstallCard />
        </div>

        <Link
          href="/profil/ganti-password"
          className="mt-4 flex items-center justify-between rounded-card bg-white p-4 text-base font-semibold text-ink shadow-soft"
        >
          🔑 Ganti Password
          <span className="text-ink-3">›</span>
        </Link>

        <div className="mt-4">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}

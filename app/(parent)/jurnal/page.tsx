import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { formatDateID } from '@/lib/utils'
import { getChildren } from '@/lib/activeChild'

export default async function JurnalPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { active } = await getChildren(supabase, user!.id)
  const studentIds = active ? [active.id] : []
  const studentName = active?.name ?? 'Siswa'

  const { data: journals } = studentIds.length
    ? await supabase
        .from('journals')
        .select('id, journal_date, status')
        .in('student_id', studentIds)
        .order('journal_date', { ascending: false })
        .limit(30)
    : { data: [] }

  return (
    <div>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/90 px-5 py-4 backdrop-blur">
        <div>
          <h1 className="text-lg font-black text-brand-blue">Jurnal</h1>
          <p className="text-sm text-ink-3">{studentName}</p>
        </div>
        <Link
          href="/jurnal/isi"
          className="rounded-btn bg-brand-blue px-4 py-2 font-display text-xs font-extrabold text-white shadow-soft"
        >
          + Isi
        </Link>
      </header>

      <div className="px-5 py-5">
        {!journals || journals.length === 0 ? (
          <div className="rounded-card bg-white p-6 text-center shadow-soft">
            <p className="text-ink-2">Belum ada jurnal.</p>
            <Link
              href="/jurnal/isi"
              className="mt-3 inline-block rounded-btn bg-brand-green px-4 py-2 text-xs font-bold text-white"
            >
              Isi Jurnal Hari Ini
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {journals.map((j) => (
              <li key={j.id}>
                <Link
                  href={`/jurnal/${j.id}`}
                  className="flex items-center justify-between rounded-[12px] bg-white px-4 py-3.5 shadow-row transition active:scale-[.99]"
                >
                  <div>
                    <p className="font-display text-base font-extrabold text-ink">
                      {formatDateID(j.journal_date)}
                    </p>
                  </div>
                  <StatusBadge status={j.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-ink-3',
    submitted: 'bg-emerald-100 text-emerald-600',
    reviewed: 'bg-blue-100 text-blue-600',
  }
  const label: Record<string, string> = {
    draft: 'Belum dikirim',
    submitted: 'Terkirim',
    reviewed: 'Sudah dicek',
  }
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${map[status] ?? ''}`}>
      {label[status] ?? status}
    </span>
  )
}

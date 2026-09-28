import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'

export default async function JurnalPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: links } = await supabase
    .from('student_parents')
    .select('student_id')
    .eq('user_id', user!.id)
  const studentIds = (links ?? []).map((l) => l.student_id)

  const { data: journals } = studentIds.length
    ? await supabase
        .from('journals')
        .select('id, journal_date, status, student_id')
        .in('student_id', studentIds)
        .order('journal_date', { ascending: false })
        .limit(30)
    : { data: [] }

  return (
    <div className="px-5 py-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-black text-brand-blue">Jurnal</h1>
        <Link
          href="/jurnal/isi"
          className="rounded-btn bg-brand-blue px-4 py-2 text-sm font-semibold text-white"
        >
          + Isi
        </Link>
      </div>

      {!journals || journals.length === 0 ? (
        <p className="text-gray-500">Belum ada jurnal.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {journals.map((j) => (
            <li key={j.id}>
              <Link
                href={`/jurnal/${j.id}`}
                className="flex items-center justify-between rounded-card bg-white p-4 shadow-sm"
              >
                <span className="font-medium">{j.journal_date}</span>
                <StatusBadge status={j.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-500',
    submitted: 'bg-brand-green/15 text-brand-green',
    reviewed: 'bg-brand-blue/15 text-brand-blue',
  }
  const label: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Terkirim',
    reviewed: 'Ditinjau',
  }
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status] ?? ''}`}>
      {label[status] ?? status}
    </span>
  )
}

import Link from 'next/link'
import { createServerClient, getUserCached } from '@/lib/supabase/server'
import { getSchoolCalendar } from '@/lib/schoolCalendar'
import { todayISO } from '@/lib/utils'
import KalenderClient from './KalenderClient'

export default async function KalenderPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await getUserCached()
  const { data: me } = await supabase.from('users').select('school_id').eq('id', user!.id).single()
  const cal = await getSchoolCalendar(supabase, me?.school_id ?? '')

  return (
    <div className="px-5 py-5">
      <Link prefetch={false} href="/pengaturan" className="mb-2 inline-block py-1 text-sm font-semibold text-brand-blue">
        ← Pengaturan
      </Link>
      <h1 className="font-display text-xl font-black text-ink">Hari Sekolah & Libur</h1>
      <p className="mb-5 mt-1 text-sm text-ink-2">
        Di hari libur orang tua tidak wajib mengisi, tidak dapat pengingat, dan streak anak tidak putus.
      </p>
      <KalenderClient
        days={cal.days.length === 5 ? '1-5' : '1-6'}
        holidays={cal.holidays.filter((h) => h.end_date >= todayISO()).concat(
          cal.holidays.filter((h) => h.end_date < todayISO()).reverse(),
        )}
        today={todayISO()}
      />
    </div>
  )
}

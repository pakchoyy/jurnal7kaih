import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { DEFAULT_HABIT_ITEMS } from '@/lib/habitItems'
import KebiasaanEditor from './KebiasaanEditor'

export default async function AturKebiasaanPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single()

  const [{ data: habits }, { data: items }] = await Promise.all([
    supabase.from('habits').select('id, slug, name, icon').eq('is_active', true).order('sort_order'),
    supabase
      .from('school_habit_items')
      .select('habit_id, label, sort_order')
      .eq('school_id', profile?.school_id ?? '')
      .order('sort_order'),
  ])

  const rows = (habits ?? []).map((h) => {
    const custom = (items ?? []).filter((i) => i.habit_id === h.id).map((i) => i.label)
    return {
      ...h,
      items: custom.length ? custom : DEFAULT_HABIT_ITEMS[h.slug] ?? [],
      isCustom: custom.length > 0,
    }
  })

  return (
    <div className="px-5 py-5">
      <Link prefetch={false} href="/pengaturan" className="mb-2 inline-block py-1 text-sm font-semibold text-brand-blue">
        ← Pengaturan
      </Link>
      <h1 className="font-display text-xl font-black text-ink">Isi Poin Kebiasaan</h1>
      <p className="mb-5 mt-1 text-sm text-ink-2">
        Atur pilihan yang dicentang orang tua di tiap kebiasaan. Berlaku untuk semua kelas di sekolah Anda.
      </p>
      <KebiasaanEditor habits={rows} />
    </div>
  )
}

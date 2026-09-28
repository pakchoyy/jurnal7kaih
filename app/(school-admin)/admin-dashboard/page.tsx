import { createServerClient } from '@/lib/supabase/server'
import { todayISO } from '@/lib/utils'

// Ganti dengan link produk Lynk.id kamu bila sudah ada
const LYNK_RENEW_URL = 'https://lynk.id/kreacy'

export default async function SchoolAdminDashboard() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Ambil data sekolah & masa aktif
  const { data: profile } = await supabase
    .from('users')
    .select('school_id, schools(id, name, code, plan, active_until)')
    .eq('id', user!.id)
    .single()

  const school = (profile?.schools as unknown as {
    id: string
    name: string
    code: string
    plan: string
    active_until: string
  } | null)

  const activeUntilDate = school?.active_until ? new Date(school.active_until) : null
  const now = new Date()
  const diffDays = activeUntilDate
    ? Math.ceil((activeUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const isExpired = diffDays <= 0

  const [{ count: studentCount }, { count: classCount }, { count: teacherCount }] =
    await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('classes').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    ])

  const { count: todayCount } = await supabase
    .from('journals')
    .select('*', { count: 'exact', head: true })
    .eq('journal_date', todayISO())
    .neq('status', 'draft')

  const stats = [
    { label: 'Siswa aktif', value: studentCount ?? 0, color: 'text-brand-blue' },
    { label: 'Kelas', value: classCount ?? 0, color: 'text-brand-teal' },
    { label: 'Guru', value: teacherCount ?? 0, color: 'text-brand-yellow' },
    { label: 'Jurnal hari ini', value: todayCount ?? 0, color: 'text-brand-green' },
  ]

  return (
    <div className="px-5 py-6">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-blue">Dashboard</h1>
          <p className="text-xs text-gray-500">{school?.name} (Kode: {school?.code})</p>
        </div>
        <div className="mt-2 sm:mt-0">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
              isExpired
                ? 'bg-red-100 text-red-600'
                : diffDays <= 14
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-brand-green/15 text-brand-green'
            }`}
          >
            {isExpired
              ? 'Masa Aktif Habis'
              : `Paket ${school?.plan?.toUpperCase()} · Sisa ${diffDays} hari`}
          </span>
        </div>
      </div>

      {/* Banner Peringatan Expired / Habis */}
      {isExpired ? (
        <div className="mb-6 rounded-card border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
          <p className="font-bold">⚠️ Masa aktif lisensi sekolah telah berakhir.</p>
          <p className="mt-1 text-sm">
            Perpanjang masa aktif per semester untuk tetap menggunakan semua fitur.
          </p>
          <a
            href={LYNK_RENEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-btn bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Perpanjang di Lynk.id →
          </a>
        </div>
      ) : diffDays <= 14 ? (
        <div className="mb-6 rounded-card border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="font-bold">⏳ Masa aktif tersisa {diffDays} hari lagi.</p>
              <p className="text-xs">
                Perpanjang sebelum masa berlaku habis agar pelaporan jurnal siswa tidak terganggu.
              </p>
            </div>
            <a
              href={LYNK_RENEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-btn bg-brand-yellow px-4 py-2 text-center text-xs font-bold text-brand-dark transition"
            >
              Perpanjang Sekarang
            </a>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-card bg-white p-4 shadow-sm">
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

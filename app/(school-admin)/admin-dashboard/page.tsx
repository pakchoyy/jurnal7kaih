import { createServerClient } from '@/lib/supabase/server'
import { todayISO, daysUntil, formatDateID } from '@/lib/utils'

const LYNK_RENEW_URL = 'https://lynk.id/kreacy'

export default async function SchoolAdminDashboard() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, schools(id, name, code, plan, active_until)')
    .eq('id', user!.id)
    .single()

  const school = profile?.schools as unknown as {
    id: string
    name: string
    code: string
    plan: string
    active_until: string
  } | null

  const diffDays = school?.active_until ? daysUntil(school.active_until) : 0
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
    { label: 'Siswa aktif', value: studentCount ?? 0 },
    { label: 'Kelas', value: classCount ?? 0 },
    { label: 'Guru', value: teacherCount ?? 0 },
    { label: 'Jurnal hari ini', value: todayCount ?? 0 },
  ]

  return (
    <div>
      <header className="bg-grad-dark px-5 pb-6 pt-5 text-white">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-lg font-black">Dashboard</h1>
            <p className="text-[11px] opacity-60">
              {school?.name} · Kode {school?.code}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-bold ${
              isExpired
                ? 'bg-red-500 text-white'
                : diffDays <= 14
                ? 'bg-brand-yellow text-brand-dark'
                : 'bg-emerald-400 text-emerald-950'
            }`}
          >
            {isExpired
              ? 'MASA AKTIF HABIS'
              : `${school?.plan?.toUpperCase()} · ${diffDays} HARI`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-[12px] border border-white/10 bg-white/[.08] px-3 py-2.5"
            >
              <p className="font-display text-xl font-black leading-tight text-emerald-300">
                {s.value}
              </p>
              <p className="mt-0.5 text-[10px] text-white/55">{s.label}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="px-5 py-5">
        {isExpired ? (
          <div className="rounded-card border border-red-200 bg-red-50 p-4 text-red-800 shadow-soft">
            <p className="font-display font-extrabold">⚠️ Masa aktif lisensi telah berakhir</p>
            <p className="mt-1 text-sm">
              Perpanjang langganan per semester agar semua fitur aktif kembali.
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
          <div className="flex flex-col gap-3 rounded-card border border-yellow-200 bg-yellow-50 p-4 text-yellow-900 shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display font-extrabold">⏳ Masa aktif tersisa {diffDays} hari</p>
              <p className="text-xs">
                Berakhir {formatDateID(school?.active_until ?? '')}. Perpanjang agar tidak terputus.
              </p>
            </div>
            <a
              href={LYNK_RENEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-btn bg-brand-yellow px-4 py-2 text-center text-xs font-bold text-brand-dark"
            >
              Perpanjang Sekarang
            </a>
          </div>
        ) : (
          <div className="rounded-card border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-soft">
            <p className="font-display font-extrabold">✅ Lisensi aktif</p>
            <p className="text-xs">
              Paket {school?.plan} berlaku sampai {formatDateID(school?.active_until ?? '')}.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

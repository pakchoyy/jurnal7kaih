import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/ui/AppHeader'
import { BottomNav } from '@/components/ui/BottomNav'
import { ExpiredGate } from '@/components/ui/ExpiredGate'
import { BILLING_ENABLED } from '@/lib/billing'
import { themeVars } from '@/lib/theme'

function daysLeft(until: string | null): number | null {
  if (!until) return null
  return Math.ceil((new Date(until).getTime() - Date.now()) / 86400000)
}

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, name, whatsapp, schools(name, plan, active_until, logo_url, theme_color)')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'teacher') redirect('/login')

  const school = profile?.schools as unknown as {
    name: string
    plan: string
    active_until: string
    logo_url: string | null
    theme_color: string | null
  } | null

  const days = daysLeft(school?.active_until ?? null)
  const isExpired = BILLING_ENABLED && days !== null && days <= 0
  const isTrial = BILLING_ENABLED && school?.plan === 'trial'
  const showBanner = BILLING_ENABLED && (isExpired || (isTrial && days !== null && days <= 3))
  const badge = !BILLING_ENABLED ? undefined : isExpired ? 'Habis' : isTrial ? `Trial ${days} hari` : 'PRO'

  return (
    <div className="min-h-dvh bg-bg pb-24" style={themeVars(school?.theme_color)}>
      <AppHeader
        title={school?.name ?? 'SiHebat'}
        subtitle={profile?.name ? `Guru · ${profile.name}` : 'Panel Guru'}
        logoUrl={school?.logo_url}
        badge={badge}
        homeHref="/teacher-dashboard"
        menu={[
          { href: '/teacher-dashboard', label: 'Dashboard', icon: 'home' },
          { href: '/kelas', label: 'Kelas Saya', icon: 'class' },
          { href: '/kelas/buat', label: 'Buat Kelas Baru', icon: 'edit' },
          { href: '/kelas/import', label: 'Import Kelas (Excel)', icon: 'list' },
          { href: '/siswa', label: 'Semua Siswa', icon: 'users' },
          { href: '/pengaturan/kebiasaan', label: 'Isi Poin Kebiasaan', icon: 'list' },
          { href: '/pengaturan/kalender', label: 'Hari Sekolah & Libur', icon: 'journal' },
          { href: '/pengaturan/tim', label: 'Guru & Kepala Sekolah', icon: 'family' },
          { href: '/pengaturan', label: 'Pengaturan', icon: 'settings' },
        ]}
      />

      {showBanner && (
        <div className={`px-5 py-3 text-center text-sm font-semibold ${isExpired ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
          {isExpired ? 'Masa aktif sudah habis. ' : `Masa trial tinggal ${days} hari. `}
          <Link prefetch={false} href="/pengaturan" className="font-bold underline">
            Upgrade ke Pro →
          </Link>
        </div>
      )}

      {!profile?.whatsapp && (
        <Link prefetch={false}
          href="/pengaturan#wa"
          className="flex items-center gap-3 bg-emerald-50 px-5 py-3 text-sm text-emerald-900"
        >
          <span className="float-y text-xl">💬</span>
          <span className="flex-1">
            <b>Nomor WA Anda belum diisi.</b> Isi sekarang agar orang tua bisa langsung menghubungi Anda dari aplikasi.
          </span>
          <span className="font-bold">Isi →</span>
        </Link>
      )}

      <div className="mx-auto max-w-3xl">
        <ExpiredGate
          expired={isExpired}
          allowPrefix="/pengaturan"
          title="Masa aktif habis"
          message="Data Anda aman. Masukkan kode lisensi untuk lanjut memakai aplikasi."
          action={{ href: '/pengaturan', label: 'Masukkan Kode Lisensi' }}
        >
          {children}
        </ExpiredGate>
      </div>

      <BottomNav
        items={[
          { href: '/teacher-dashboard', label: 'Dashboard', icon: 'home' },
          { href: '/kelas', label: 'Kelas', icon: 'class' },
          { href: '/siswa', label: 'Siswa', icon: 'users' },
          { href: '/pengaturan', label: 'Pengaturan', icon: 'settings' },
        ]}
      />
    </div>
  )
}

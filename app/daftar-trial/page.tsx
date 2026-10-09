'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerSchoolSelf } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthShell } from '@/components/ui/AuthShell'
import { BILLING_ENABLED } from '@/lib/billing'

export default function DaftarTrialPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!BILLING_ENABLED) {
    return (
      <AuthShell
        title="Pendaftaran Ditutup"
        subtitle="Pendaftaran akun mandiri sedang tidak dibuka."
        footer={
          <p className="text-sm text-ink-2">
            Sudah punya akun?{' '}
            <Link prefetch={false} href="/login" className="font-semibold text-brand-blue">
              Masuk di sini
            </Link>
          </p>
        }
      >
        <p className="rounded-card bg-white p-5 text-center text-sm text-ink-2 shadow-soft">
          Silakan hubungi admin sekolah untuk dibuatkan akun.
        </p>
      </AuthShell>
    )
  }
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)

    setLoading(true)
    const res = await registerSchoolSelf({
      schoolName: String(form.get('schoolName') ?? ''),
      adminName: String(form.get('adminName') ?? ''),
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      phone: String(form.get('phone') ?? ''),
    })
    setLoading(false)

    if (!res.ok) {
      setError(res.error ?? 'Gagal mendaftar')
      return
    }
    router.push('/login?registered=1')
  }

  return (
    <AuthShell
      gradient="bg-grad-teal"
      badge={
        <span className="inline-block rounded-pill bg-white/25 px-3 py-1 text-xs font-bold text-white">
          ✨ Coba Gratis 14 Hari
        </span>
      }
      title="Daftar Akun Guru"
      subtitle="Gratis 14 hari, semua fitur. Tanpa kartu kredit."
      footer={
        <p className="text-sm text-ink-2">
          Sudah punya akun?{' '}
          <Link prefetch={false} href="/login" className="font-semibold text-brand-blue">
            Masuk di sini
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          name="schoolName"
          label="Nama Sekolah"
          placeholder="mis. SMP Negeri 1 Contoh"
          required
        />
        <Input name="adminName" label="Nama Guru" placeholder="Nama lengkap Anda" autoComplete="name" required />
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="nama@email.com"
          autoComplete="email"
          required
        />
        <Input
          name="password"
          type="password"
          label="Password"
          placeholder="Minimal 6 karakter"
          autoComplete="new-password"
          minLength={6}
          required
        />
        <Input
          name="phone"
          type="tel"
          inputMode="tel"
          label="Nomor WhatsApp"
          placeholder="0812xxxxxxxx"
          hint="Ditampilkan ke orang tua agar mudah menghubungi Anda"
          required
        />

        {error && (
          <p className="rounded-btn bg-red-50 p-3 text-sm font-semibold text-red-500">{error}</p>
        )}
        <Button type="submit" variant="secondary" size="lg" block disabled={loading}>
          {loading ? 'Memproses…' : 'Mulai Coba Gratis'}
        </Button>
      </form>
    </AuthShell>
  )
}

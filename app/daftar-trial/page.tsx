'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerSchoolSelf } from '@/app/aktivasi-sekolah/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthShell } from '@/components/ui/AuthShell'

export default function DaftarTrialPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)

    setLoading(true)
    const res = await registerSchoolSelf(
      {
        schoolName: String(form.get('schoolName') ?? ''),
        adminName: String(form.get('adminName') ?? ''),
        email: String(form.get('email') ?? ''),
        password: String(form.get('password') ?? ''),
        phone: String(form.get('phone') ?? ''),
      },
      'trial',
    )
    setLoading(false)

    if (!res.ok) {
      setError(res.error ?? 'Gagal mendaftar')
      return
    }
    router.push('/login?registered=1')
  }

  return (
    <AuthShell
      gradient="bg-grad-yellow"
      badge={
        <span className="inline-block rounded-pill bg-white/25 px-3 py-1 text-xs font-bold text-brand-dark">
          ✨ Coba Gratis 14 Hari
        </span>
      }
      title="Daftar Trial Sekolah"
      subtitle="Coba semua fitur Jurnal 7Kaih tanpa biaya."
      footer={
        <p className="text-sm text-ink-2">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-brand-blue">
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
        <Input name="adminName" label="Nama Admin Sekolah" placeholder="Nama Anda" required />
        <Input
          name="email"
          type="email"
          label="Email Admin"
          placeholder="admin@sekolah.sch.id"
          required
        />
        <Input
          name="password"
          type="password"
          label="Password"
          placeholder="Minimal 6 karakter"
          required
        />
        <Input name="phone" type="tel" label="Nomor WhatsApp (opsional)" placeholder="0812xxxx" />

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

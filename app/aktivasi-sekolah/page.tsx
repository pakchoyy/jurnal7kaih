'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerSchoolSelf } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthShell } from '@/components/ui/AuthShell'

export default function AktivasiSekolahPage() {
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
      'semester',
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
      gradient="bg-grad-green"
      badge={
        <span className="inline-block rounded-pill bg-white/20 px-3 py-1 text-xs font-bold">
          ✅ Paket Semester (6 Bulan)
        </span>
      }
      title="Aktivasi Sekolah"
      subtitle="Terima kasih berlangganan! Daftarkan sekolah & akun admin Anda."
      footer={
        <p className="text-xs text-ink-3">
          Sudah pernah daftar?{' '}
          <Link href="/login" className="font-semibold text-brand-blue">
            Masuk ke Akun
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
        <Input
          name="adminName"
          label="Nama Penanggung Jawab / Admin"
          placeholder="Nama Anda"
          required
        />
        <Input
          name="email"
          type="email"
          label="Email Admin (untuk login)"
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
        <Button type="submit" variant="green" size="lg" block disabled={loading}>
          {loading ? 'Mendaftarkan…' : 'Daftarkan & Aktifkan'}
        </Button>
      </form>
    </AuthShell>
  )
}

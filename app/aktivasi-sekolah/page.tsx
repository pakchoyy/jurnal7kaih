'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerSchoolSelf } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <span className="inline-block rounded-full bg-brand-green/15 px-3 py-1 text-xs font-bold text-brand-green">
          Paket Semester (6 Bulan)
        </span>
        <h1 className="mt-2 text-2xl font-black text-brand-blue">Aktivasi Sekolah 7Kaih</h1>
        <p className="mt-1 text-sm text-gray-500">
          Terima kasih telah berlangganan! Daftarkan sekolah & akun admin Anda.
        </p>
      </div>

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
        <Input
          name="phone"
          type="tel"
          label="Nomor WhatsApp (opsional)"
          placeholder="0812xxxx"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" size="lg" disabled={loading}>
          {loading ? 'Mendaftarkan…' : 'Daftarkan & Aktifkan Sekolah'}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-400">
        Sudah pernah daftar?{' '}
        <Link href="/login" className="font-semibold text-brand-blue">
          Masuk ke Akun
        </Link>
      </p>
    </main>
  )
}

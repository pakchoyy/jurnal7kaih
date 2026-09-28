'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { activateParent } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthShell } from '@/components/ui/AuthShell'

const relationships = ['Ayah', 'Ibu', 'Wali'] as const

export default function AktivasiPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)

    setLoading(true)
    const result = await activateParent({
      code: String(form.get('code') ?? ''),
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      relationship: String(form.get('relationship') ?? 'Ayah') as 'Ayah' | 'Ibu' | 'Wali',
    })
    setLoading(false)

    if (!result.ok) {
      setError(result.error ?? 'Gagal aktivasi')
      return
    }
    router.push('/login?registered=1')
  }

  return (
    <AuthShell
      gradient="bg-grad-green"
      badge={
        <span className="inline-block rounded-pill bg-white/20 px-3 py-1 text-xs font-bold">
          🎫 Kode dari Sekolah
        </span>
      }
      title="Aktivasi Akun Orang Tua"
      subtitle="Masukkan kode aktivasi 8 karakter dari sekolah"
      footer={
        <p className="text-sm text-ink-2">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-brand-blue">
            Masuk
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          name="code"
          label="Kode Aktivasi"
          placeholder="8 karakter"
          required
          className="uppercase tracking-widest"
        />
        <Input name="name" label="Nama Lengkap" placeholder="Nama Anda" required />
        <Input name="email" type="email" label="Email" placeholder="nama@email.com" required />
        <Input
          name="password"
          type="password"
          label="Password"
          placeholder="Minimal 6 karakter"
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="font-display text-[13px] font-extrabold text-ink">
            Hubungan dengan Anak
          </label>
          <select
            name="relationship"
            defaultValue="Ayah"
            className="rounded-btn border-[1.5px] border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-green"
          >
            {relationships.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded-btn bg-red-50 p-3 text-sm font-semibold text-red-500">{error}</p>
        )}
        <Button type="submit" variant="green" size="lg" block disabled={loading}>
          {loading ? 'Mengaktifkan…' : 'Aktivasi Akun'}
        </Button>
      </form>
    </AuthShell>
  )
}

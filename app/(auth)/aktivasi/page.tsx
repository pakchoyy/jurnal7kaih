'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { activateParent } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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
    router.push('/login')
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-black text-brand-blue">Aktivasi Akun Orang Tua</h1>
        <p className="mt-1 text-gray-500">Masukkan kode aktivasi dari sekolah</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input name="code" label="Kode Aktivasi" placeholder="8 karakter" required className="uppercase" />
        <Input name="name" label="Nama Lengkap" placeholder="Nama Anda" required />
        <Input name="email" type="email" label="Email" placeholder="nama@email.com" required />
        <Input name="password" type="password" label="Password" placeholder="Minimal 6 karakter" required />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-brand-dark">Hubungan dengan Anak</label>
          <select
            name="relationship"
            className="rounded-btn border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            defaultValue="Ayah"
          >
            {relationships.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? 'Mengaktifkan…' : 'Aktivasi'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-semibold text-brand-blue">
          Masuk
        </Link>
      </p>
    </main>
  )
}

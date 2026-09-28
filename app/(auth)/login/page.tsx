'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { loginSchema } from '@/lib/schemas/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)
    const parsed = loginSchema.safeParse({
      email: form.get('email'),
      password: form.get('password'),
    })
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Input tidak valid')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data)
    setLoading(false)

    if (signInError) {
      setError('Email atau password salah')
      return
    }
    router.push('/beranda')
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-brand-blue">Jurnal 7Kaih</h1>
        <p className="mt-1 text-gray-500">7 Kebiasaan Anak Indonesia Hebat</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input name="email" type="email" label="Email" placeholder="nama@email.com" required />
        <Input name="password" type="password" label="Password" placeholder="••••••" required />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? 'Memproses…' : 'Masuk'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Punya kode aktivasi?{' '}
        <Link href="/aktivasi" className="font-semibold text-brand-blue">
          Aktivasi akun
        </Link>
      </p>
    </main>
  )
}

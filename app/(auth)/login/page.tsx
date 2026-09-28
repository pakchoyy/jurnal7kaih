'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { loginSchema } from '@/lib/schemas/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthShell } from '@/components/ui/AuthShell'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')

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
    <AuthShell
      title="Masuk"
      subtitle="7 Kebiasaan Anak Indonesia Hebat"
      footer={
        <div className="flex flex-col gap-2 text-sm text-ink-2">
          <p>
            Orang Tua punya kode aktivasi?{' '}
            <Link href="/aktivasi" className="font-semibold text-brand-blue">
              Aktivasi Akun Ortu
            </Link>
          </p>
          <p>
            Sekolah ingin mencoba?{' '}
            <Link href="/daftar-trial" className="font-semibold text-brand-teal">
              Coba Gratis 14 Hari
            </Link>
          </p>
        </div>
      }
    >
      {registered && (
        <div className="mb-4 rounded-btn bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-600">
          Pendaftaran sekolah berhasil! Silakan login.
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input name="email" type="email" label="Email" placeholder="nama@email.com" required />
        <Input name="password" type="password" label="Password" placeholder="••••••" required />
        {error && (
          <p className="rounded-btn bg-red-50 p-3 text-sm font-semibold text-red-500">{error}</p>
        )}
        <Button type="submit" size="lg" block disabled={loading}>
          {loading ? 'Memproses…' : 'Masuk'}
        </Button>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-ink-3">Memuat…</div>}>
      <LoginForm />
    </Suspense>
  )
}

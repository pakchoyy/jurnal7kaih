'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getRoleRedirect } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthShell } from '@/components/ui/AuthShell'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')

  const [tab, setTab] = useState<'parent' | 'teacher'>('parent')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)

    let email: string
    const password = String(form.get('password') ?? '')

    if (tab === 'parent') {
      const nis = String(form.get('nis') ?? '').trim()
      if (!nis) { setError('NIS wajib diisi'); return }
      if (!password) { setError('Password wajib diisi'); return }
      email = `${nis}@7kaih.internal`
    } else {
      email = String(form.get('email') ?? '').trim()
      if (!email) { setError('Email wajib diisi'); return }
      if (!password) { setError('Password wajib diisi'); return }
    }

    setLoading(true)
    const supabase = createClient()
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (signInError || !signInData.user) {
      setError(tab === 'parent' ? 'NIS atau password salah' : 'Email atau password salah')
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', signInData.user.id)
      .single()

    router.push(getRoleRedirect(profile?.role))
    router.refresh()
  }

  return (
    <AuthShell
      title="Masuk"
      subtitle="7 Kebiasaan Anak Indonesia Hebat"
      footer={
        tab === 'teacher' ? (
          <div className="flex flex-col gap-2 text-sm text-ink-2">
            <p>
              Sekolah ingin mencoba?{' '}
              <Link href="/daftar-trial" className="font-semibold text-brand-teal">
                Coba Gratis 14 Hari
              </Link>
            </p>
          </div>
        ) : (
          <p className="text-sm text-ink-2">
            Lupa NIS? Hubungi wali kelas via WA.
          </p>
        )
      }
    >
      {registered && (
        <div className="mb-4 rounded-btn bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-600">
          Pendaftaran sekolah berhasil! Silakan login.
        </div>
      )}

      {/* Tab switcher */}
      <div className="mb-5 flex rounded-btn bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => { setTab('parent'); setError(null) }}
          className={`flex-1 rounded-[10px] py-2 text-sm font-semibold transition ${
            tab === 'parent' ? 'bg-white text-ink shadow-sm' : 'text-ink-3'
          }`}
        >
          Orang Tua
        </button>
        <button
          type="button"
          onClick={() => { setTab('teacher'); setError(null) }}
          className={`flex-1 rounded-[10px] py-2 text-sm font-semibold transition ${
            tab === 'teacher' ? 'bg-white text-ink shadow-sm' : 'text-ink-3'
          }`}
        >
          Guru / Admin
        </button>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {tab === 'parent' ? (
          <Input
            name="nis"
            type="text"
            label="NIS Siswa"
            placeholder="Nomor Induk Siswa"
            required
            inputMode="numeric"
          />
        ) : (
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="nama@email.com"
            required
          />
        )}

        <Input
          name="password"
          type="password"
          label={tab === 'parent' ? 'Password (default: NIS)' : 'Password'}
          placeholder="••••••"
          required
        />

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

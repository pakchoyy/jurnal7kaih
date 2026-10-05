'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getRoleRedirect, toAuthPassword } from '@/lib/utils'
import { BILLING_ENABLED } from '@/lib/billing'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthShell } from '@/components/ui/AuthShell'
import { cariAkunOrtu, type ParentLoginOption } from './actions'

type Tab = 'parent' | 'teacher'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')

  const [tab, setTab] = useState<Tab>(registered ? 'teacher' : 'parent')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [schoolOptions, setSchoolOptions] = useState<ParentLoginOption[]>([])
  const [showPassword, setShowPassword] = useState(false)

  function switchTab(t: Tab) {
    setTab(t)
    setError(null)
    setSchoolOptions([])
  }

  async function signIn(email: string, password: string) {
    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: tab === 'parent' ? toAuthPassword(password) : password,
    })
    if (signInError || !data.user) {
      setError(
        tab === 'parent'
          ? 'Gagal masuk. Cek NIS atau hubungi wali kelas.'
          : 'Email atau password salah.',
      )
      return
    }
    const { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).single()
    router.replace(getRoleRedirect(profile?.role))
    router.refresh()
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)
    const password = String(form.get('password') ?? '')
    if (tab === 'teacher' && !password) return setError('Password wajib diisi')

    setLoading(true)
    try {
      if (tab === 'teacher') {
        const email = String(form.get('email') ?? '').trim()
        if (!email) return setError('Email wajib diisi')
        await signIn(email, password)
        return
      }

      // Password ortu dikunci = NIS, jadi ortu cukup mengetik NIS.
      const nis = String(form.get('nis') ?? '').trim()
      if (!nis) return setError('NIS wajib diisi')
      const picked = String(form.get('school') ?? '')
      if (picked) {
        await signIn(picked, nis)
        return
      }

      const options = await cariAkunOrtu(nis)
      if (options.length === 0) {
        setError('NIS tidak ditemukan. Cek lagi atau tanyakan ke wali kelas.')
      } else if (options.length === 1) {
        await signIn(options[0].email, nis)
      } else {
        setSchoolOptions(options)
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Masuk"
      subtitle="Aplikasi Jurnal Digital 7 Kebiasaan Anak Indonesia Hebat"
      footer={
        tab === 'teacher' ? (
          BILLING_ENABLED ? (
            <p className="text-sm text-ink-2">
              Guru belum punya akun?{' '}
              <Link href="/daftar-trial" className="font-bold text-brand-teal underline">
                Coba Gratis 14 Hari
              </Link>
            </p>
          ) : (
            <p className="text-sm text-ink-2">Akun guru dibuat oleh admin sekolah.</p>
          )
        ) : (
          <p className="text-sm leading-relaxed text-ink-2">
            Lupa NIS?
            <br />
            Tanyakan ke wali kelas lewat WhatsApp.
          </p>
        )
      }
    >
      {registered && (
        <div className="mb-4 rounded-btn bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700">
          Pendaftaran berhasil! Silakan masuk dengan email Anda.
        </div>
      )}

      <div role="tablist" className="mb-5 grid grid-cols-2 rounded-btn bg-gray-100 p-1">
        {(
          [
            ['parent', 'Orang Tua'],
            ['teacher', 'Guru / Kepsek'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => switchTab(key)}
            className={`rounded-[10px] py-2.5 text-base font-bold transition ${
              tab === key ? 'bg-white text-brand-blue shadow-sm' : 'text-ink-3'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {tab === 'parent' ? (
          <Input
            key="nis"
            name="nis"
            type="text"
            label="NIS Anak"
            placeholder="Contoh: 12345"
            inputMode="numeric"
            autoComplete="username"
            hint="Nomor Induk Siswa, bisa ditanyakan ke wali kelas"
            required
            onChange={() => schoolOptions.length && setSchoolOptions([])}
            className="py-3 text-base"
          />
        ) : (
          <Input
            key="email"
            name="email"
            type="email"
            label="Email"
            placeholder="nama@email.com"
            autoComplete="email"
            required
            className="py-3 text-base"
          />
        )}

        {tab === 'parent' && schoolOptions.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="school" className="font-display text-[13px] font-extrabold text-ink">
              Pilih Sekolah Anak
            </label>
            <select
              id="school"
              name="school"
              required
              defaultValue=""
              className="w-full rounded-btn border-[1.5px] border-brand-blue bg-white px-3.5 py-3 text-base"
            >
              <option value="" disabled>
                — Pilih sekolah —
              </option>
              {schoolOptions.map((o) => (
                <option key={o.email} value={o.email}>
                  {o.school}
                </option>
              ))}
            </select>
            <span className="text-xs text-ink-3">NIS ini terdaftar di lebih dari satu sekolah.</span>
          </div>
        )}

        {tab === 'teacher' && (
        <div className="flex flex-col gap-1.5">
          <Input
            name="password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="••••••"
            autoComplete="current-password"
            required
            className="py-3 text-base"
          />
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            Tampilkan password
          </label>
        </div>
        )}

        {error && (
          <p role="alert" className="rounded-btn bg-red-50 p-3 text-sm font-semibold text-red-600">
            {error}
          </p>
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

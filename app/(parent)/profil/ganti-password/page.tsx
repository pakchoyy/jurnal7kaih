'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { Input } from '@/components/ui/Input'
import { gantiPassword, type FormState } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-btn bg-brand-blue py-3.5 text-base font-bold text-white disabled:opacity-50"
    >
      {pending ? 'Menyimpan…' : 'Simpan Password Baru'}
    </button>
  )
}

export default function GantiPasswordPage() {
  const [state, action] = useFormState<FormState, FormData>(gantiPassword, null)

  return (
    <div>
      <header className="flex items-center gap-3 border-b border-line bg-white/90 px-5 py-3.5 backdrop-blur">
        <Link href="/profil" aria-label="Kembali" className="px-1 text-2xl text-ink-2">
          ←
        </Link>
        <h1 className="text-lg font-black text-brand-blue">Ganti Password</h1>
      </header>

      <div className="px-5 py-5">
        {state?.ok ? (
          <div className="rounded-card bg-emerald-50 p-5 text-center">
            <p className="text-3xl">✅</p>
            <p className="mt-2 text-base font-bold text-emerald-700">Password berhasil diganti</p>
            <p className="mt-1 text-sm text-ink-2">Pakai password baru saat login berikutnya.</p>
            <Link
              href="/beranda"
              className="mt-4 inline-block rounded-btn bg-brand-blue px-6 py-3 text-base font-bold text-white"
            >
              Ke Beranda
            </Link>
          </div>
        ) : (
          <form action={action} className="flex flex-col gap-4 rounded-card bg-white p-5 shadow-soft">
            <p className="text-sm text-ink-2">
              Password awal akun ini adalah NIS anak. Ganti supaya orang lain tidak bisa masuk.
            </p>
            <Input
              name="password"
              type="password"
              label="Password Baru"
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
              minLength={6}
              required
              className="py-3 text-base"
            />
            <Input
              name="confirm"
              type="password"
              label="Ulangi Password Baru"
              autoComplete="new-password"
              minLength={6}
              required
              className="py-3 text-base"
            />
            {state?.error && (
              <p role="alert" className="rounded-btn bg-red-50 p-3 text-sm font-semibold text-red-600">
                {state.error}
              </p>
            )}
            <SubmitButton />
          </form>
        )}
      </div>
    </div>
  )
}

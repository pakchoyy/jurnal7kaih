'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { Input } from '@/components/ui/Input'
import { hubungkanAnak, type LinkState } from '../../anakActions'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-btn bg-brand-blue py-3.5 text-base font-bold text-white disabled:opacity-50"
    >
      {pending ? 'Memeriksa…' : 'Hubungkan'}
    </button>
  )
}

export default function TambahAnakPage() {
  const [state, action] = useFormState<LinkState, FormData>(hubungkanAnak, null)

  return (
    <div>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white/90 px-5 py-3.5 backdrop-blur">
        <Link href="/profil" aria-label="Kembali" className="px-1 text-2xl text-ink-2">
          ←
        </Link>
        <h1 className="text-lg font-black text-brand-blue">Tambah Kakak / Adik</h1>
      </header>

      <div className="px-5 py-5">
        {state?.ok ? (
          <div className="rounded-card bg-emerald-50 p-5 text-center">
            <p className="text-3xl">👨‍👩‍👧‍👦</p>
            <p className="mt-2 text-base font-bold text-emerald-700">{state.ok}</p>
            <p className="mt-1 text-sm text-ink-2">Ganti anak lewat tombol nama di Beranda.</p>
            <Link href="/beranda" className="mt-4 inline-block rounded-btn bg-brand-blue px-6 py-3 text-base font-bold text-white">
              Ke Beranda
            </Link>
          </div>
        ) : (
          <form action={action} className="flex flex-col gap-4 rounded-card bg-white p-5 shadow-soft">
            <p className="text-sm text-ink-2">
              Punya anak lain di sekolah yang sama? Masukkan NIS dan password akun anak tersebut (password awal = NIS).
              Setelah itu cukup login dengan satu akun.
            </p>
            <Input name="nis" label="NIS Kakak / Adik" inputMode="numeric" autoComplete="off" required className="py-3 text-base" />
            <Input
              name="password"
              type="password"
              label="Password akun anak tersebut"
              autoComplete="off"
              required
              className="py-3 text-base"
            />
            {state?.error && (
              <p role="alert" className="rounded-btn bg-red-50 p-3 text-sm font-semibold text-red-600">
                {state.error}
              </p>
            )}
            <Submit />
          </form>
        )}
      </div>
    </div>
  )
}

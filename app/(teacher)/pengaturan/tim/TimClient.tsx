'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import { Input } from '@/components/ui/Input'
import { tambahAnggota, ubahStatusAnggota, type TeamState } from './actions'

interface Member {
  id: string
  name: string
  email: string | null
  role: string
  status: string | null
}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="rounded-btn bg-brand-blue py-3.5 text-base font-bold text-white disabled:opacity-50">
      {pending ? 'Menyimpan…' : 'Tambah Akun'}
    </button>
  )
}

export default function TimClient({ members, myId }: { members: Member[]; myId: string }) {
  const router = useRouter()
  const [state, action] = useFormState<TeamState, FormData>(tambahAnggota, null)
  const [pending, start] = useTransition()

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {members.map((m) => {
          const active = m.status !== 'inactive'
          return (
            <li key={m.id} className="flex items-center gap-3 rounded-card bg-white p-4 shadow-soft">
              <span className="text-2xl">{m.role === 'principal' ? '🎓' : '👩‍🏫'}</span>
              <div className="min-w-0 flex-1">
                <p className={`text-base font-bold ${active ? 'text-ink' : 'text-ink-3 line-through'}`}>
                  {m.name} {m.id === myId && <span className="text-sm font-normal text-ink-3">(Anda)</span>}
                </p>
                <p className="truncate text-sm text-ink-3">
                  {m.role === 'principal' ? 'Kepala Sekolah' : 'Guru'} · {m.email}
                </p>
              </div>
              {m.id !== myId && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (active && !confirm(`Nonaktifkan akun ${m.name}? Ia tidak bisa login lagi.`)) return
                    start(async () => {
                      const res = await ubahStatusAnggota(m.id, !active)
                      if (res.error) alert(res.error)
                      router.refresh()
                    })
                  }}
                  className={`rounded-btn px-3 py-2 text-sm font-bold ${active ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}
                >
                  {active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <form action={action} className="flex flex-col gap-3 rounded-card bg-white p-5 shadow-soft">
        <p className="font-display text-base font-extrabold text-ink">Tambah Akun</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center justify-center gap-2 rounded-btn border-2 border-line p-3 text-base has-[:checked]:border-brand-blue has-[:checked]:bg-brand-blue-light">
            <input type="radio" name="role" value="teacher" defaultChecked /> Guru
          </label>
          <label className="flex items-center justify-center gap-2 rounded-btn border-2 border-line p-3 text-base has-[:checked]:border-brand-blue has-[:checked]:bg-brand-blue-light">
            <input type="radio" name="role" value="principal" /> Kepala Sekolah
          </label>
        </div>
        <Input name="name" label="Nama" required className="py-3 text-base" />
        <Input name="email" type="email" label="Email (untuk login)" autoComplete="off" required className="py-3 text-base" />
        <Input
          name="password"
          type="text"
          label="Password awal"
          hint="Minimal 6 karakter. Kirim ke yang bersangkutan."
          minLength={6}
          autoComplete="off"
          required
          className="py-3 text-base"
        />
        <Input name="whatsapp" type="tel" label="No. WhatsApp (boleh kosong)" className="py-3 text-base" />
        {state?.error && <p role="alert" className="rounded-btn bg-red-50 p-3 text-sm font-semibold text-red-600">{state.error}</p>}
        {state?.ok && <p className="rounded-btn bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{state.ok}</p>}
        <Submit />
      </form>
    </div>
  )
}

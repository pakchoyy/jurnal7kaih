'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { mulaiTahunAjaranBaru } from './tahunAjaranActions'

export default function TahunAjaranCard({ current }: { current: string | null }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const next = current ? `${Number(current.slice(0, 4)) + 1}/${Number(current.slice(0, 4)) + 2}` : null

  return (
    <div className="mb-4 rounded-card bg-white p-5 shadow-soft">
      <p className="font-display text-base font-extrabold text-ink">Tahun Ajaran</p>
      <p className="mt-1 text-sm text-ink-2">
        Aktif: <b>{current ?? '-'}</b>
      </p>
      <p className="mt-1 text-sm text-ink-3">
        Di awal tahun ajaran baru, mulai tahun baru lalu buka kelas lama → <b>Naik Kelas</b> untuk memindahkan siswa.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Mulai tahun ajaran ${next ?? 'baru'}? Kelas lama pindah ke bagian "tahun lalu".`)) return
          start(async () => {
            const res = await mulaiTahunAjaranBaru()
            setMsg(res.error ?? `Tahun ajaran ${res.name} aktif`)
            router.refresh()
          })
        }}
        className="mt-3 w-full rounded-btn border-2 border-brand-blue/30 py-3 text-base font-bold text-brand-blue disabled:opacity-50"
      >
        {pending ? 'Memproses…' : `Mulai Tahun Ajaran ${next ?? 'Baru'}`}
      </button>
      {msg && <p className="mt-2 text-sm font-semibold text-ink-2">{msg}</p>}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { simpanWhatsapp, pakaiLicenseKey } from './actions'

const PLAN_LABEL: Record<string, string> = {
  trial: 'Trial',
  semester: 'Pro Semester',
  annual: 'Pro Tahunan',
  lifetime: 'Lifetime',
}

function daysLeft(until: string | null): number | null {
  if (!until) return null
  return Math.ceil((new Date(until).getTime() - Date.now()) / 86400000)
}

function formatDate(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function PengaturanClient({
  whatsapp,
  plan,
  activeUntil,
}: {
  whatsapp: string
  plan: string
  activeUntil: string | null
}) {
  const [wa, setWa] = useState(whatsapp)
  const [waLoading, setWaLoading] = useState(false)
  const [waMsg, setWaMsg] = useState<string | null>(null)

  const [key, setKey] = useState('')
  const [keyLoading, setKeyLoading] = useState(false)
  const [keyMsg, setKeyMsg] = useState<{ ok?: boolean; text: string } | null>(null)

  const days = daysLeft(activeUntil)
  const isExpired = days !== null && days <= 0

  async function handleWa(e: React.FormEvent) {
    e.preventDefault()
    setWaLoading(true)
    setWaMsg(null)
    const fd = new FormData()
    fd.set('whatsapp', wa)
    const res = await simpanWhatsapp(fd)
    setWaLoading(false)
    setWaMsg(res?.error ?? 'Tersimpan!')
  }

  async function handleKey(e: React.FormEvent) {
    e.preventDefault()
    setKeyLoading(true)
    setKeyMsg(null)
    const fd = new FormData()
    fd.set('key', key)
    const res = await pakaiLicenseKey(fd)
    setKeyLoading(false)
    if (res?.error) {
      setKeyMsg({ ok: false, text: res.error })
    } else if (res?.ok) {
      const label = PLAN_LABEL[res.plan ?? ''] ?? res.plan
      setKeyMsg({ ok: true, text: `Berhasil! ${label} aktif hingga ${formatDate(res.activeUntil ?? null)}` })
      setKey('')
    }
  }

  return (
    <div className="px-5 py-5">
      <h1 className="mb-5 font-display text-lg font-black text-ink">Pengaturan</h1>

      {/* Status plan */}
      <div className="mb-4 rounded-card bg-white p-4 shadow-soft">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-3">Status Langganan</p>
        <div className="flex items-center justify-between">
          <p className="font-display text-base font-extrabold text-ink">{PLAN_LABEL[plan] ?? plan}</p>
          {!isExpired && days !== null && (
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${plan === 'trial' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {days} hari lagi
            </span>
          )}
          {isExpired && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-600">Expired</span>
          )}
        </div>
        {activeUntil && (
          <p className="mt-0.5 text-[11px] text-ink-3">Aktif hingga {formatDate(activeUntil)}</p>
        )}
      </div>

      {/* Nomor WhatsApp */}
      <div className="mb-4 rounded-card bg-white p-5 shadow-soft">
        <p className="mb-1 font-display text-sm font-extrabold text-ink">Nomor WhatsApp Guru</p>
        <p className="mb-3 text-[12px] text-ink-3">
          Ditampilkan ke orang tua siswa di halaman beranda mereka.
        </p>
        <form onSubmit={handleWa} className="flex gap-2">
          <input
            value={wa}
            onChange={(e) => setWa(e.target.value)}
            placeholder="08xxxxxxxxxx"
            inputMode="tel"
            className="flex-1 rounded-btn border border-line px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
          />
          <button
            type="submit"
            disabled={waLoading}
            className="rounded-btn bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {waLoading ? '…' : 'Simpan'}
          </button>
        </form>
        {waMsg && (
          <p className={`mt-2 text-[12px] font-semibold ${waMsg === 'Tersimpan!' ? 'text-emerald-600' : 'text-red-500'}`}>
            {waMsg}
          </p>
        )}
      </div>

      {/* License Key */}
      <div className="rounded-card bg-white p-5 shadow-soft">
        <p className="mb-1 font-display text-sm font-extrabold text-ink">Aktifkan Lisensi Pro</p>
        <p className="mb-4 text-[12px] text-ink-3">
          Masukkan kode lisensi untuk upgrade atau perpanjang masa aktif.
        </p>
        <form onSubmit={handleKey} className="flex flex-col gap-3">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            placeholder="7KAIH-XXXXXX-XXXXXX-XXXXXX"
            className="w-full rounded-btn border border-line px-3 py-2.5 font-mono text-sm uppercase tracking-widest focus:border-brand-blue focus:outline-none"
            required
          />
          {keyMsg && (
            <p className={`rounded-btn p-3 text-sm font-semibold ${keyMsg.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
              {keyMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={keyLoading || !key}
            className="rounded-btn bg-brand-blue py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {keyLoading ? 'Memproses…' : 'Aktifkan'}
          </button>
        </form>
        <p className="mt-3 text-[11px] text-ink-3">
          Belum punya kode?{' '}
          <a
            href="https://wa.me/6281234567890?text=Halo%2C+saya+ingin+upgrade+ke+Pro+7Kaih"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-teal underline"
          >
            Hubungi kami via WA
          </a>
        </p>
      </div>
    </div>
  )
}

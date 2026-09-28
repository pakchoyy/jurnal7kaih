'use client'

import { useState } from 'react'
import { pakaiLicenseKey } from './actions'

const PLAN_LABEL: Record<string, string> = {
  trial: 'Trial',
  semester: 'Pro Semester',
  annual: 'Pro Tahunan',
  lifetime: 'Lifetime',
}

const PLAN_COLOR: Record<string, string> = {
  trial: 'bg-amber-100 text-amber-700',
  semester: 'bg-emerald-100 text-emerald-700',
  annual: 'bg-brand-blue-light text-brand-blue',
  lifetime: 'bg-purple-100 text-purple-700',
}

function daysLeft(until: string | null): number | null {
  if (!until) return null
  const diff = new Date(until).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDate(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function PengaturanPage() {
  // Data diambil via searchParams / props — tapi ini simple version via fetch
  // Gunakan server component wrapper nanti jika perlu
  return <PengaturanClient />
}

function PengaturanClient() {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const fd = new FormData()
    fd.set('key', key)
    const res = await pakaiLicenseKey(fd)
    setLoading(false)
    if (res?.error) {
      setMsg({ ok: false, text: res.error })
    } else if (res?.ok) {
      const label = PLAN_LABEL[res.plan ?? ''] ?? res.plan
      const date = formatDate(res.activeUntil ?? null)
      setMsg({ ok: true, text: `Berhasil! Plan ${label} aktif hingga ${date}` })
      setKey('')
    }
  }

  return (
    <div className="px-5 py-5">
      <h1 className="mb-5 font-display text-lg font-black text-ink">Pengaturan Akun</h1>

      {/* Upgrade / License Key */}
      <div className="rounded-card bg-white p-5 shadow-soft">
        <p className="mb-1 font-display text-sm font-extrabold text-ink">Aktifkan Lisensi Pro</p>
        <p className="mb-4 text-[12px] text-ink-3">
          Masukkan kode lisensi yang kamu dapat untuk upgrade ke Pro.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            placeholder="7KAIH-XXXXXX-XXXXXX"
            className="w-full rounded-btn border border-line px-3 py-2.5 font-mono text-sm uppercase tracking-widest focus:border-brand-blue focus:outline-none"
            required
          />

          {msg && (
            <p
              className={`rounded-btn p-3 text-sm font-semibold ${
                msg.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              }`}
            >
              {msg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !key}
            className="rounded-btn bg-brand-blue py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? 'Memproses…' : 'Aktifkan'}
          </button>
        </form>

        <p className="mt-4 text-[11px] text-ink-3">
          Belum punya kode lisensi?{' '}
          <a
            href="https://wa.me/628111234567?text=Halo%2C+saya+ingin+upgrade+ke+Pro+7Kaih"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-teal underline"
          >
            Hubungi kami via WhatsApp
          </a>
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { buatLicenseKey } from './actions'

export default function LisensiClient({
  keys,
}: {
  keys: { key: string; plan: string; used_at: string | null; used_by_school_id: string | null }[]
}) {
  const [plan, setPlan] = useState('semester')
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)
  const [newKeys, setNewKeys] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData()
    fd.set('plan', plan)
    fd.set('qty', String(qty))
    const res = await buatLicenseKey(fd)
    setLoading(false)
    if (res?.error) {
      setError(res.error)
    } else if (res?.ok) {
      setNewKeys(res.keys ?? [])
    }
  }

  return (
    <div className="px-5 py-5">
      <h1 className="mb-5 font-display text-lg font-black text-ink">License Keys</h1>

      <form onSubmit={handleSubmit} className="mb-6 rounded-card bg-white p-5 shadow-soft">
        <p className="mb-3 font-display text-sm font-extrabold text-ink">Generate Key Baru</p>

        <div className="mb-3 flex gap-3">
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="flex-1 rounded-btn border border-line px-3 py-2.5 text-sm"
          >
            <option value="semester">Pro Semester (6 bln)</option>
            <option value="annual">Pro Tahunan (12 bln)</option>
            <option value="lifetime">Lifetime</option>
          </select>
          <input
            type="number"
            min={1}
            max={50}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-20 rounded-btn border border-line px-3 py-2.5 text-sm"
          />
        </div>

        {error && (
          <p className="mb-3 rounded-btn bg-red-50 p-3 text-sm font-semibold text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-btn bg-brand-blue px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? 'Membuat…' : `Generate ${qty} Key`}
        </button>
      </form>

      {newKeys.length > 0 && (
        <div className="mb-6 rounded-card border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-2 text-sm font-bold text-emerald-700">Key baru ({newKeys.length}):</p>
          <div className="flex flex-col gap-1">
            {newKeys.map((k) => (
              <code key={k} className="block rounded bg-white px-3 py-1.5 font-mono text-xs text-ink">
                {k}
              </code>
            ))}
          </div>
        </div>
      )}

      <p className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
        Semua Key ({keys.length})
      </p>
      <ul className="stagger flex flex-col gap-2">
        {keys.map((k) => (
          <li
            key={k.key}
            className="flex items-center gap-3 rounded-[12px] bg-white px-4 py-3 shadow-row"
          >
            <code className="flex-1 font-mono text-xs text-ink">{k.key}</code>
            <span className="text-[10px] font-bold text-ink-3 uppercase">{k.plan}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                k.used_at ? 'bg-gray-100 text-ink-3' : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {k.used_at ? 'Dipakai' : 'Tersedia'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

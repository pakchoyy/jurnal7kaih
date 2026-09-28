'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSchoolManual, extendSchoolLicense } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { daysUntil, formatDateID } from '@/lib/utils'

interface SchoolItem {
  id: string
  name: string
  code: string
  phone: string | null
  status: string
  plan: string | null
  active_until: string | null
  buyer_email: string | null
  created_at: string
}

export function SekolahClient({ schools }: { schools: SchoolItem[] }) {
  const router = useRouter()
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newPlan, setNewPlan] = useState<'trial' | 'semester' | 'annual'>('semester')
  const [newPhone, setNewPhone] = useState('')

  const activeCount = schools.filter((s) => s.active_until && daysUntil(s.active_until) > 0).length
  const trialCount = schools.filter((s) => s.plan === 'trial').length
  const expiredCount = schools.filter((s) => !s.active_until || daysUntil(s.active_until) <= 0).length

  async function handleAddSchool(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading('add')
    const res = await createSchoolManual(newName, newPlan, newPhone)
    setLoading(null)
    if (!res.ok) {
      setError(res.error ?? 'Gagal menambah sekolah')
      return
    }
    setNewName('')
    setNewPhone('')
    setShowAddModal(false)
    router.refresh()
  }

  async function handleExtend(schoolId: string, months: number) {
    setLoading(schoolId)
    const res = await extendSchoolLicense(schoolId, months)
    setLoading(null)
    if (!res.ok) {
      alert(res.error ?? 'Gagal memperpanjang')
      return
    }
    router.refresh()
  }

  return (
    <div className="px-5 py-5">
      {/* Statistik ringkas */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        <div className="rounded-card bg-white p-3 text-center shadow-soft">
          <p className="font-display text-2xl font-black text-emerald-500">{activeCount}</p>
          <p className="text-[10px] text-ink-3">Aktif</p>
        </div>
        <div className="rounded-card bg-white p-3 text-center shadow-soft">
          <p className="font-display text-2xl font-black text-brand-yellow">{trialCount}</p>
          <p className="text-[10px] text-ink-3">Trial</p>
        </div>
        <div className="rounded-card bg-white p-3 text-center shadow-soft">
          <p className="font-display text-2xl font-black text-red-500">{expiredCount}</p>
          <p className="text-[10px] text-ink-3">Expired</p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-extrabold text-ink">
          Daftar Sekolah ({schools.length})
        </h2>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          + Tambah Manual
        </Button>
      </div>

      {showAddModal && (
        <div className="mb-5 rounded-card border border-brand-blue/30 bg-white p-5 shadow-lift">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-black text-brand-blue">
              Tambah Sekolah Manual (Cadangan)
            </h3>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-sm font-bold text-ink-3 hover:text-ink-2"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleAddSchool} className="flex flex-col gap-3">
            <Input
              label="Nama Sekolah"
              placeholder="mis. SMP PGRI 1"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[13px] font-extrabold text-ink">
                Paket Lisensi
              </label>
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value as any)}
                className="rounded-btn border-[1.5px] border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-blue"
              >
                <option value="semester">Semester (6 Bulan)</option>
                <option value="trial">Trial (14 Hari)</option>
                <option value="annual">Tahunan (1 Tahun)</option>
              </select>
            </div>
            <Input
              label="No. WhatsApp (opsional)"
              placeholder="0812xxxx"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
            {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading === 'add'}>
                {loading === 'add' ? 'Menyimpan…' : 'Simpan Sekolah'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                Batal
              </Button>
            </div>
          </form>
        </div>
      )}

      {schools.length === 0 ? (
        <div className="rounded-card bg-white p-6 text-center text-sm text-ink-3 shadow-soft">
          Belum ada sekolah terdaftar.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {schools.map((s) => {
            const diff = s.active_until ? daysUntil(s.active_until) : -1
            const isExpired = diff <= 0

            return (
              <li key={s.id} className="rounded-card bg-white p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-extrabold text-ink">
                      {s.name}
                    </p>
                    <p className="font-mono text-[11px] text-ink-3">{s.code}</p>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      isExpired
                        ? 'bg-red-100 text-red-600'
                        : s.plan === 'trial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    {s.plan?.toUpperCase() ?? '-'} · {isExpired ? 'EXPIRED' : `${diff} hari`}
                  </span>
                </div>

                <p className="mt-1.5 text-[11px] text-ink-3">
                  {s.active_until ? `Aktif s/d ${formatDateID(s.active_until)}` : 'Tanpa masa aktif'} ·
                  {' '}{s.buyer_email || s.phone || 'tanpa kontak'}
                </p>

                <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                  <button
                    type="button"
                    disabled={loading === s.id}
                    onClick={() => handleExtend(s.id, 6)}
                    className="flex-1 rounded-btn border-[1.5px] border-brand-blue/30 bg-brand-blue/5 px-3 py-1.5 font-display text-[11px] font-extrabold text-brand-blue transition hover:bg-brand-blue hover:text-white disabled:opacity-50"
                  >
                    {loading === s.id ? '…' : '+6 Bulan'}
                  </button>
                  <button
                    type="button"
                    disabled={loading === s.id}
                    onClick={() => handleExtend(s.id, 12)}
                    className="rounded-btn border-[1.5px] border-line px-3 py-1.5 text-[11px] font-semibold text-ink-2 transition hover:border-ink-3 disabled:opacity-50"
                  >
                    +1 Tahun
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSchoolManual, extendSchoolLicense } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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

  // Form state
  const [newName, setNewName] = useState('')
  const [newPlan, setNewPlan] = useState<'trial' | 'semester' | 'annual'>('semester')
  const [newPhone, setNewPhone] = useState('')

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

  const now = new Date()

  return (
    <div className="px-5 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-blue">Monitoring Sekolah & Lisensi</h1>
          <p className="text-xs text-gray-500">
            Total {schools.length} sekolah terdaftar (otomatis dari Lynk.id & trial)
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          + Tambah Manual
        </Button>
      </div>

      {showAddModal && (
        <div className="mb-6 rounded-card border border-brand-blue/30 bg-white p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-brand-blue">Tambah Sekolah Manual (Cadangan)</h2>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-sm font-bold text-gray-400 hover:text-gray-600"
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
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-dark">Paket Lisensi</label>
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value as any)}
                className="rounded-btn border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
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
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading === 'add'}>
                {loading === 'add' ? 'Menyimpan…' : 'Simpan Sekolah'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddModal(false)}
              >
                Batal
              </Button>
            </div>
          </form>
        </div>
      )}

      {schools.length === 0 ? (
        <p className="mt-5 text-gray-500">Belum ada sekolah terdaftar.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {schools.map((s) => {
            const activeUntil = s.active_until ? new Date(s.active_until) : null
            const diffDays = activeUntil
              ? Math.ceil((activeUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              : 0
            const isExpired = diffDays <= 0

            return (
              <li
                key={s.id}
                className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-dark">{s.name}</span>
                    <span className="font-mono text-xs text-gray-400">({s.code})</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isExpired
                          ? 'bg-red-100 text-red-600'
                          : s.plan === 'trial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-brand-green/15 text-brand-green'
                      }`}
                    >
                      {s.plan?.toUpperCase()} · {isExpired ? 'EXPIRED' : `${diffDays} hari lagi`}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Aktif s/d: {activeUntil ? activeUntil.toISOString().slice(0, 10) : '-'} · Email:{' '}
                    {s.buyer_email || s.phone || '-'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loading === s.id}
                    onClick={() => handleExtend(s.id, 6)}
                    className="rounded-btn border border-brand-blue/30 bg-brand-blue/5 px-3 py-1.5 text-xs font-bold text-brand-blue transition hover:bg-brand-blue hover:text-white disabled:opacity-50"
                  >
                    {loading === s.id ? '…' : '+6 Bulan (1 Semester)'}
                  </button>
                  <button
                    type="button"
                    disabled={loading === s.id}
                    onClick={() => handleExtend(s.id, 12)}
                    className="rounded-btn border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-gray-400 disabled:opacity-50"
                  >
                    +1 Thn
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

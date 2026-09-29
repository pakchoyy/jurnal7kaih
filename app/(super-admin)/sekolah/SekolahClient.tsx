'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adjustSchoolLicense, createSchoolManual, extendSchoolLicense, type LicenseAdjust } from './actions'
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

  const [newPlan, setNewPlan] = useState<'trial' | 'semester' | 'annual'>('semester')

  const activeCount = schools.filter((s) => s.active_until && daysUntil(s.active_until) > 0).length
  const trialCount = schools.filter((s) => s.plan === 'trial').length
  const expiredCount = schools.filter((s) => !s.active_until || daysUntil(s.active_until) <= 0).length

  async function handleAddSchool(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)
    setLoading('add')
    const res = await createSchoolManual(
      {
        schoolName: String(form.get('schoolName') ?? ''),
        adminName: String(form.get('adminName') ?? ''),
        email: String(form.get('email') ?? ''),
        password: String(form.get('password') ?? ''),
        phone: String(form.get('phone') ?? ''),
      },
      newPlan,
    )
    setLoading(null)
    if (!res.ok) {
      setError(res.error ?? 'Gagal menambah sekolah')
      return
    }
    setShowAddModal(false)
    router.refresh()
  }

  async function handleAdjust(schoolId: string, name: string, mode: LicenseAdjust) {
    const label: Record<LicenseAdjust, string> = {
      minus1: 'kurangi 1 bulan',
      minus6: 'kurangi 6 bulan',
      trial: 'reset ke trial 14 hari dari sekarang',
      expire: 'nonaktifkan sekarang (masa aktif habis)',
    }
    if (!confirm(`${name}: ${label[mode]}?`)) return
    setLoading(schoolId)
    const res = await adjustSchoolLicense(schoolId, mode)
    setLoading(null)
    if (!res.ok) {
      alert(res.error ?? 'Gagal')
      return
    }
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
              Tambah Sekolah + Akun Guru
            </h3>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-sm font-bold text-ink-3 hover:text-ink-2"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleAddSchool} className="flex flex-col gap-3">
            <Input name="schoolName" label="Nama Sekolah" placeholder="mis. SMP PGRI 1" required />
            <Input name="adminName" label="Nama Guru" placeholder="Nama lengkap guru" required />
            <Input
              name="email"
              type="email"
              label="Email Guru (untuk login)"
              placeholder="guru@email.com"
              autoComplete="off"
              required
            />
            <Input
              name="password"
              type="text"
              label="Password Awal"
              placeholder="Minimal 6 karakter"
              hint="Kirim ke guru, minta diganti setelah login"
              minLength={6}
              autoComplete="off"
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
            <Input name="phone" type="tel" label="No. WhatsApp Guru (opsional)" placeholder="0812xxxx" />
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
        <ul className="stagger flex flex-col gap-3">
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
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {(
                    [
                      ['minus1', '−1 Bln', 'text-amber-700 border-amber-200 bg-amber-50'],
                      ['minus6', '−6 Bln', 'text-amber-700 border-amber-200 bg-amber-50'],
                      ['trial', 'Reset Trial', 'text-sky-700 border-sky-200 bg-sky-50'],
                      ['expire', 'Nonaktif', 'text-red-600 border-red-200 bg-red-50'],
                    ] as const
                  ).map(([mode, label, cls]) => (
                    <button
                      key={mode}
                      type="button"
                      disabled={loading === s.id}
                      onClick={() => handleAdjust(s.id, s.name, mode)}
                      className={`rounded-btn border-[1.5px] px-1 py-1.5 text-[11px] font-bold disabled:opacity-50 ${cls}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

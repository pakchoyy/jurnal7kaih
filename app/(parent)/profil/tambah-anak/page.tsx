'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const relationships = ['Ayah', 'Ibu', 'Wali'] as const

export default function TambahAnakPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)
    const code = String(form.get('code') ?? '').trim().toUpperCase()
    const relationship = String(form.get('relationship') ?? 'Ayah')

    setLoading(true)
    const supabase = createClient()
    const { error: rpcError } = await supabase.rpc('link_child_by_code', {
      p_code: code,
      p_relationship: relationship,
    })
    setLoading(false)

    if (rpcError) {
      setError(rpcError.message)
      return
    }
    router.push('/profil')
    router.refresh()
  }

  return (
    <div>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white/90 px-5 py-3.5 backdrop-blur">
        <Link href="/profil" className="text-xl text-ink-3">
          ←
        </Link>
        <h1 className="text-base font-black text-brand-blue">Tambah Anak</h1>
      </header>

      <div className="px-5 py-5">
        <div className="mb-5 rounded-card bg-grad-blue p-4 text-white shadow-soft">
          <p className="text-sm font-semibold">🔗 Tautkan anak ke akun Anda</p>
          <p className="mt-0.5 text-[11px] opacity-80">
            Masukkan kode aktivasi 8 karakter yang diberikan pihak sekolah.
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            name="code"
            label="Kode Aktivasi"
            placeholder="8 karakter"
            required
            className="uppercase tracking-widest"
          />
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[13px] font-extrabold text-ink">Hubungan</label>
            <select
              name="relationship"
              defaultValue="Ayah"
              className="w-full rounded-btn border-[1.5px] border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-blue"
            >
              {relationships.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-btn bg-red-50 p-3 text-sm font-semibold text-red-500">{error}</p>
          )}
          <Button type="submit" size="lg" block disabled={loading}>
            {loading ? 'Menautkan…' : 'Tautkan Anak'}
          </Button>
        </form>
      </div>
    </div>
  )
}

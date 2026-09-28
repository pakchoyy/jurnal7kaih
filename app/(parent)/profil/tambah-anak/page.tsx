'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
    <div className="px-5 py-6">
      <h1 className="text-2xl font-black text-brand-blue">Tambah Anak</h1>
      <p className="mt-1 text-sm text-gray-500">
        Masukkan kode aktivasi dari sekolah untuk menautkan anak ke akun Anda.
      </p>

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
        <Input name="code" label="Kode Aktivasi" placeholder="8 karakter" required className="uppercase" />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-brand-dark">Hubungan</label>
          <select
            name="relationship"
            defaultValue="Ayah"
            className="rounded-btn border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-blue"
          >
            {relationships.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? 'Menautkan…' : 'Tautkan Anak'}
        </Button>
      </form>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { hapusKelas } from './actions'

export default function HapusKelasButton({
  classId,
  className,
}: {
  classId: string
  className: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onDelete() {
    if (!confirm('Hapus kelas ini permanen? Hanya bisa bila kelas sudah kosong (tanpa siswa).')) return
    setLoading(true)
    const res = await hapusKelas(classId)
    setLoading(false)
    if (!res.ok) {
      alert(res.error ?? 'Gagal menghapus kelas')
      return
    }
    router.push('/kelas')
    router.refresh()
  }

  return (
    <button type="button" disabled={loading} onClick={onDelete} className={className}>
      {loading ? 'Menghapus…' : '🗑️ Hapus'}
    </button>
  )
}

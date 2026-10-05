'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { hapusKelas } from './actions'

export default function HapusKelasButton({
  classId,
  className,
  info,
}: {
  classId: string
  className: string
  /** Ringkasan isi kelas untuk peringatan, mis. "3 siswa, 51 jurnal". */
  info: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onDelete() {
    if (
      !confirm(
        `Hapus kelas ini PERMANEN?${info ? `\n${info} ikut terhapus dan tidak bisa dikembalikan.` : ''}`,
      )
    )
      return
    setLoading(true)
    const res = await hapusKelas(classId)
    setLoading(false)
    if (!res.ok) {
      alert(res.error ?? 'Gagal menghapus kelas')
      return
    }
    alert(`Kelas dihapus (${res.students ?? 0} siswa, ${res.journals ?? 0} jurnal).`)
    router.push('/kelas')
    router.refresh()
  }

  return (
    <button type="button" disabled={loading} onClick={onDelete} className={className}>
      {loading ? 'Menghapus…' : '🗑️ Hapus'}
    </button>
  )
}

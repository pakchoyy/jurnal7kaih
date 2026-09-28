'use client'

import { useState } from 'react'

export function ReminderCard({ className, names, total }: { className: string; names: string[]; total: number }) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  if (total === 0) return null

  if (names.length === 0) {
    return (
      <div className="mb-4 rounded-card bg-emerald-50 p-4 text-base font-semibold text-emerald-800">
        🎉 Semua siswa kelas {className} sudah mengisi jurnal hari ini!
      </div>
    )
  }

  const text =
    `Yth. Bapak/Ibu orang tua kelas ${className} 🙏\n` +
    `Pengingat jurnal 7 Kebiasaan di aplikasi SiHebat hari ini.\n` +
    `Yang belum mengisi:\n` +
    names.map((n, i) => `${i + 1}. ${n}`).join('\n') +
    `\n\nMohon diisi sebelum tidur ya. Terima kasih 😊`

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setOpen(true)
    }
  }

  return (
    <div className="mb-4 rounded-card border border-amber-200 bg-amber-50 p-4">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left">
        <span className="text-base font-bold text-amber-900">
          ⏰ {names.length} dari {total} siswa belum isi hari ini
        </span>
        <span className="text-sm text-amber-800">{open ? 'Tutup' : 'Lihat'}</span>
      </button>
      {open && <p className="mt-2 text-sm text-amber-900">{names.join(', ')}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-btn bg-emerald-600 py-3 text-center text-sm font-bold text-white"
        >
          Kirim ke Grup WA
        </a>
        <button type="button" onClick={copy} className="rounded-btn border border-amber-300 bg-white py-3 text-sm font-bold text-amber-900">
          {copied ? 'Tersalin ✓' : 'Salin Teks'}
        </button>
      </div>
    </div>
  )
}

'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { importSiswa, type ImportResult } from './actions'

export default function ImportSiswaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<{ name: string; nis: string; nisn?: string; gender?: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw: any[] = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false })
      const rows = raw.map((r) => ({
        name: String(r['Nama'] ?? r['name'] ?? r['NAMA'] ?? ''),
        nis: String(r['NIS'] ?? r['nis'] ?? ''),
        nisn: String(r['NISN'] ?? r['nisn'] ?? '') || undefined,
        gender: String(r['Jenis Kelamin'] ?? r['gender'] ?? r['Gender'] ?? '') || undefined,
      })).filter((r) => r.name || r.nis)
      setPreview(rows)
      setResult(null)
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleImport() {
    if (!preview.length) return
    setLoading(true)
    const res = await importSiswa(params.id, preview)
    setLoading(false)
    setResult(res)
    if (res.success > 0) setPreview([])
  }

  return (
    <div className="px-5 py-5">
      <div className="mb-5 flex items-center gap-3">
        <Link href={`/kelas/${params.id}`} className="py-2 text-sm font-semibold text-brand-blue">← Kembali</Link>
        <h1 className="font-display text-lg font-black text-ink">Import Siswa (Excel)</h1>
      </div>

      {/* Panduan format */}
      <div className="mb-5 rounded-[12px] bg-amber-50 p-4 text-[12px] text-amber-700">
        <p className="mb-1 font-bold">Format kolom Excel:</p>
        <p>Baris pertama = judul kolom: <b>Nama</b>, <b>NIS</b>, <b>NISN</b> (boleh kosong), <b>Jenis Kelamin</b> (L/P).</p>
        <p className="mt-1">Akun orang tua otomatis dibuat. Login pakai NIS, password awal = NIS.</p>
        <a
          href={`/api/export-siswa?classId=${params.id}`}
          className="mt-2 inline-block font-semibold underline"
        >
          ↓ Download contoh format (Excel)
        </a>
      </div>

      {/* Upload */}
      <div
        onClick={() => fileRef.current?.click()}
        className="mb-5 flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed border-line bg-white p-8 text-center transition hover:border-brand-blue"
      >
        <span className="mb-2 text-3xl">📂</span>
        <p className="text-sm font-semibold text-ink">Pilih file Excel (.xlsx / .xls)</p>
        <p className="mt-0.5 text-xs text-ink-3">Klik di sini</p>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
            Preview ({preview.length} baris)
          </p>
          <div className="overflow-x-auto rounded-card bg-white shadow-soft">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-3 py-2 font-bold text-ink-2">Nama</th>
                  <th className="px-3 py-2 font-bold text-ink-2">NIS</th>
                  <th className="px-3 py-2 font-bold text-ink-2">NISN</th>
                  <th className="px-3 py-2 font-bold text-ink-2">JK</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((r, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 text-ink">{r.name || <span className="text-red-400">—</span>}</td>
                    <td className="px-3 py-2 font-mono text-ink">{r.nis || <span className="text-red-400">—</span>}</td>
                    <td className="px-3 py-2 text-ink-3">{r.nisn ?? '—'}</td>
                    <td className="px-3 py-2 text-ink-3">{r.gender ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 10 && (
              <p className="px-3 py-2 text-[11px] text-ink-3">...dan {preview.length - 10} baris lainnya</p>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={loading}
            className="mt-4 w-full rounded-btn bg-brand-blue py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? `Mengimpor ${preview.length} siswa…` : `Import ${preview.length} Siswa`}
          </button>
        </div>
      )}

      {/* Hasil */}
      {result && (
        <div className="rounded-card bg-white p-5 shadow-soft">
          <p className="mb-3 font-display text-sm font-extrabold text-ink">Hasil Import</p>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="font-display text-2xl font-black text-emerald-500">{result.success}</p>
              <p className="text-[11px] text-ink-3">Berhasil</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl font-black text-amber-500">{result.skipped}</p>
              <p className="text-[11px] text-ink-3">Dilewati</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1">
              {result.errors.map((e, i) => (
                <li key={i} className="text-[11px] text-red-500">{e}</li>
              ))}
            </ul>
          )}
          <Link
            href={`/kelas/${params.id}`}
            className="mt-4 inline-block rounded-btn bg-brand-blue px-5 py-2.5 text-sm font-bold text-white"
          >
            Lihat Kelas
          </Link>
        </div>
      )}
    </div>
  )
}

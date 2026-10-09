'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { importKelas, type ClassRow, type ImportKelasResult } from './actions'

const CHUNK = 40
const MAX_TOTAL = 1500

function downloadTemplate() {
  const ws = XLSX.utils.json_to_sheet(
    [
      { Kelas: '1A', Tingkat: 1, Nama: 'Andi Pratama', NIS: '240101', NISN: '', 'Jenis Kelamin': 'L' },
      { Kelas: '1A', Tingkat: 1, Nama: 'Bunga Lestari', NIS: '240102', NISN: '', 'Jenis Kelamin': 'P' },
      { Kelas: '2B', Tingkat: 2, Nama: 'Citra Ayu', NIS: '230215', NISN: '', 'Jenis Kelamin': 'P' },
    ],
    { header: ['Kelas', 'Tingkat', 'Nama', 'NIS', 'NISN', 'Jenis Kelamin'] },
  )
  ws['!cols'] = [{ wch: 8 }, { wch: 8 }, { wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 14 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Siswa')
  XLSX.writeFile(wb, 'template-import-kelas-sihebat.xlsx')
}

export default function ImportKelasPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ClassRow[]>([])
  const [progress, setProgress] = useState<number | null>(null)
  const [result, setResult] = useState<ImportKelasResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'array' })
        const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
          defval: '',
          raw: false,
        })
        const pick = (r: Record<string, unknown>, ...keys: string[]) => {
          for (const k of keys) {
            const hit = Object.keys(r).find((x) => x.trim().toLowerCase() === k.toLowerCase())
            if (hit && String(r[hit]).trim()) return String(r[hit]).trim()
          }
          return ''
        }
        const parsed = raw
          .map((r) => ({
            kelas: pick(r, 'Kelas', 'Rombel', 'Class'),
            tingkat: pick(r, 'Tingkat', 'Grade') || undefined,
            name: pick(r, 'Nama', 'Nama Siswa', 'Name'),
            nis: pick(r, 'NIS', 'No Induk', 'Nomor Induk'),
            nisn: pick(r, 'NISN') || undefined,
            gender: pick(r, 'Jenis Kelamin', 'JK', 'L/P', 'Gender') || undefined,
          }))
          .filter((r) => r.name || r.nis)
        if (parsed.length > MAX_TOTAL) {
          setError(`File berisi ${parsed.length} baris. Maksimal ${MAX_TOTAL} baris sekali import — pecah jadi beberapa file.`)
          return
        }
        if (!parsed.some((r) => r.kelas)) {
          setError('Kolom "Kelas" tidak ditemukan. Gunakan template di atas.')
          return
        }
        setRows(parsed)
      } catch {
        setError('File tidak bisa dibaca. Pastikan formatnya .xlsx / .xls / .csv')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleImport() {
    const total: ImportKelasResult = { success: 0, skipped: 0, errors: [], classesCreated: 0 }
    setProgress(0)
    for (let i = 0; i < rows.length; i += CHUNK) {
      const part = rows.slice(i, i + CHUNK)
      const res = await importKelas(part)
      total.success += res.success
      total.skipped += res.skipped
      total.classesCreated += res.classesCreated
      // Nomor baris dari server relatif ke potongan; sesuaikan ke baris file asli.
      total.errors.push(...res.errors.map((e) => e.replace(/^Baris (\d+)/, (_, n) => `Baris ${Number(n) + i}`)))
      setProgress(Math.min(rows.length, i + CHUNK))
      if (res.errors.length === 1 && res.success === 0 && res.skipped === 0) break
    }
    setProgress(null)
    setRows([])
    setResult(total)
  }

  const byClass = rows.reduce<Record<string, number>>((acc, r) => {
    const k = (r.kelas || '(kosong)').toUpperCase()
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="px-5 py-5">
      <Link prefetch={false} href="/kelas" className="mb-2 inline-block py-1 text-sm font-semibold text-brand-blue">
        ← Kelas
      </Link>
      <h1 className="font-display text-xl font-black text-ink">Import Kelas dari Excel</h1>
      <p className="mb-4 mt-1 text-sm text-ink-2">
        Satu file untuk banyak kelas. Kelas yang belum ada otomatis dibuat, akun orang tua otomatis jadi.
      </p>

      <div className="mb-4 rounded-card bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-bold">Kolom yang dibutuhkan:</p>
        <p className="mt-1">
          <b>Kelas</b>, <b>Tingkat</b> (angka, boleh kosong), <b>Nama</b>, <b>NIS</b>, <b>NISN</b> (boleh kosong),{' '}
          <b>Jenis Kelamin</b> (L/P)
        </p>
        <button
          type="button"
          onClick={downloadTemplate}
          className="mt-3 rounded-btn bg-white px-4 py-2.5 text-sm font-bold text-amber-900 shadow-row"
        >
          ↓ Unduh Template Excel
        </button>
      </div>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={progress !== null}
        className="pressable mb-4 flex w-full flex-col items-center justify-center rounded-card border-2 border-dashed border-line bg-white p-8 text-center disabled:opacity-50"
      >
        <span className="float-y text-4xl">📂</span>
        <span className="mt-2 text-base font-bold text-ink">Pilih file Excel</span>
        <span className="text-sm text-ink-3">.xlsx, .xls, atau .csv</span>
      </button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />

      {error && (
        <p role="alert" className="mb-4 rounded-btn bg-red-50 p-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      {rows.length > 0 && (
        <div className="mb-4 rounded-card bg-white p-4 shadow-soft">
          <p className="mb-2 text-base font-bold text-ink">
            {rows.length} siswa · {Object.keys(byClass).length} kelas
          </p>
          <div className="stagger mb-4 flex flex-wrap gap-2">
            {Object.entries(byClass).map(([k, n]) => (
              <span key={k} className="rounded-pill bg-brand-blue-light px-3 py-1.5 text-sm font-bold text-brand-blue">
                Kelas {k} · {n}
              </span>
            ))}
          </div>
          {progress === null ? (
            <button
              type="button"
              onClick={handleImport}
              className="w-full rounded-btn bg-brand-blue py-3.5 text-base font-bold text-white"
            >
              Import Sekarang
            </button>
          ) : (
            <div>
              <div className="mb-1 flex justify-between text-sm font-semibold text-ink-2">
                <span>Mengimpor… jangan tutup halaman</span>
                <span>
                  {progress}/{rows.length}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-brand-blue transition-all duration-500"
                  style={{ width: `${Math.round((progress / rows.length) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="rounded-card bg-white p-5 shadow-soft">
          <p className="mb-3 font-display text-base font-extrabold text-ink">Hasil Import</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-display text-2xl font-black text-brand-blue">{result.classesCreated}</p>
              <p className="text-xs text-ink-3">Kelas baru</p>
            </div>
            <div>
              <p className="font-display text-2xl font-black text-emerald-600">{result.success}</p>
              <p className="text-xs text-ink-3">Siswa masuk</p>
            </div>
            <div>
              <p className="font-display text-2xl font-black text-amber-600">{result.skipped}</p>
              <p className="text-xs text-ink-3">Dilewati</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <ul className="mt-3 max-h-48 overflow-y-auto text-sm text-red-600">
              {result.errors.map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          )}
          <Link prefetch={false} href="/kelas" className="mt-4 inline-block rounded-btn bg-brand-blue px-5 py-3 text-base font-bold text-white">
            Lihat Kelas
          </Link>
        </div>
      )}
    </div>
  )
}

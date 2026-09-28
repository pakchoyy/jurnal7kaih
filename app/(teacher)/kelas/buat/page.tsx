import Link from 'next/link'
import { buatKelas } from './actions'

export default function BuatKelasPage() {
  return (
    <div className="px-5 py-5">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/kelas" className="text-sm text-brand-blue">← Kembali</Link>
        <h1 className="font-display text-lg font-black text-ink">Buat Kelas Baru</h1>
      </div>

      <form action={buatKelas} className="flex flex-col gap-4 rounded-card bg-white p-5 shadow-soft">
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">
            Nama Kelas
          </label>
          <input
            name="name"
            required
            placeholder="mis. 7A, 8B, 9C"
            className="w-full rounded-btn border border-line px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-ink-3">Tulis singkat seperti "7A" atau "Merah"</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">Tingkat</label>
          <select
            name="grade"
            className="w-full rounded-btn border border-line px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
          >
            <option value="7">Kelas 7</option>
            <option value="8">Kelas 8</option>
            <option value="9">Kelas 9</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-btn bg-brand-blue py-3 text-sm font-bold text-white transition hover:opacity-90"
        >
          Buat Kelas
        </button>
      </form>
    </div>
  )
}

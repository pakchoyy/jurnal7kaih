import Link from 'next/link'
import { tambahSiswa } from './actions'

export default function TambahSiswaPage({ params }: { params: { id: string } }) {
  const action = tambahSiswa.bind(null, params.id)

  return (
    <div className="px-5 py-5">
      <div className="mb-5 flex items-center gap-3">
        <Link href={`/kelas/${params.id}`} className="text-sm text-brand-blue">← Kembali</Link>
        <h1 className="font-display text-lg font-black text-ink">Tambah Siswa</h1>
      </div>

      <form action={action} className="flex flex-col gap-4 rounded-card bg-white p-5 shadow-soft">
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">Nama Lengkap</label>
          <input
            name="name"
            required
            placeholder="Nama siswa"
            className="w-full rounded-btn border border-line px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">
            NIS <span className="font-normal text-ink-3">(dipakai orang tua untuk login)</span>
          </label>
          <input
            name="nis"
            required
            placeholder="Nomor Induk Siswa"
            className="w-full rounded-btn border border-line px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">
            NISN <span className="font-normal text-ink-3">(opsional)</span>
          </label>
          <input
            name="nisn"
            placeholder="Nomor Induk Siswa Nasional"
            className="w-full rounded-btn border border-line px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">Jenis Kelamin</label>
          <select
            name="gender"
            className="w-full rounded-btn border border-line px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
          >
            <option value="">— Pilih —</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-btn bg-brand-blue py-3 text-sm font-bold text-white transition hover:opacity-90"
        >
          Tambah Siswa
        </button>
      </form>
    </div>
  )
}

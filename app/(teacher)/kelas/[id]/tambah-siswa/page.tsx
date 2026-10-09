import Link from 'next/link'
import TambahSiswaForm from './TambahSiswaForm'

export default function TambahSiswaPage({ params }: { params: { id: string } }) {
  return (
    <div className="px-5 py-5">
      <div className="mb-5 flex items-center gap-3">
        <Link prefetch={false} href={`/kelas/${params.id}`} className="py-2 text-sm font-semibold text-brand-blue">
          ← Kembali
        </Link>
        <h1 className="font-display text-lg font-black text-ink">Tambah Siswa</h1>
      </div>
      <TambahSiswaForm classId={params.id} />
    </div>
  )
}

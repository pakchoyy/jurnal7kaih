import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { initials } from '@/lib/utils'
import { notFound } from 'next/navigation'

export default async function DetailKelasPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: kelas } = await supabase
    .from('classes')
    .select('id, name, grade, homeroom_teacher_id, academic_years(name)')
    .eq('id', params.id)
    .eq('homeroom_teacher_id', user!.id)
    .single()

  if (!kelas) notFound()

  const { data: students } = await supabase
    .from('students')
    .select('id, name, student_number, nisn, gender, status')
    .eq('class_id', params.id)
    .order('name')

  const academicYearName =
    (kelas.academic_years as unknown as { name: string } | null)?.name ?? '-'

  return (
    <div className="px-5 py-5">
      <Link href="/kelas" className="mb-2 inline-block py-1 text-sm font-semibold text-brand-blue">
        ← Semua Kelas
      </Link>
      <h1 className="font-display text-xl font-black text-ink">Kelas {kelas.name}</h1>
      <p className="mb-4 text-sm text-ink-3">Tingkat {kelas.grade} · Tahun ajaran {academicYearName}</p>

      <div className="mb-5 grid grid-cols-3 gap-2">
        <Link
          href={`/kelas/${params.id}/tambah-siswa`}
          className="rounded-btn bg-brand-blue px-2 py-3 text-center text-sm font-bold text-white"
        >
          + Siswa
        </Link>
        <Link
          href={`/kelas/${params.id}/import-siswa`}
          className="rounded-btn border border-line bg-white px-2 py-3 text-center text-sm font-bold text-ink-2"
        >
          Import Excel
        </Link>
        <a
          href={`/api/export-siswa?classId=${params.id}`}
          className="rounded-btn border border-line bg-white px-2 py-3 text-center text-sm font-bold text-ink-2"
        >
          Unduh Excel
        </a>
      </div>

      <p className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-ink-2">
        {students?.length ?? 0} Siswa
      </p>

      {!students || students.length === 0 ? (
        <div className="rounded-card bg-white p-6 text-center shadow-soft">
          <p className="text-sm text-ink-2">Belum ada siswa di kelas ini.</p>
          <p className="mt-1 text-xs text-ink-3">
            NIS siswa dipakai orang tua untuk login.
          </p>
          <Link
            href={`/kelas/${params.id}/tambah-siswa`}
            className="mt-4 inline-block rounded-btn bg-brand-blue px-5 py-2.5 text-sm font-bold text-white"
          >
            Tambah Siswa Pertama
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {students.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-[12px] bg-white px-3.5 py-3 shadow-row"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-blue text-[11px] font-bold text-white">
                {initials(s.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-extrabold text-ink">{s.name}</p>
                <p className="text-sm text-ink-3">
                  NIS: <strong className="text-ink">{s.student_number ?? '-'}</strong>
                  {s.nisn && ` · NISN: ${s.nisn}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-3">{s.gender === 'L' ? '♂' : s.gender === 'P' ? '♀' : ''}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    s.status === 'active'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-100 text-ink-3'
                  }`}
                >
                  {s.status === 'active' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {students && students.length > 0 && (
        <div className="mt-4 rounded-[12px] border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
          💡 Orang tua login di tab <b>Orang Tua</b> pakai NIS anak. Password awal = NIS. Kirimkan info ini lewat WA.
        </div>
      )}
    </div>
  )
}

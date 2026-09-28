'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureParentAccount, isSchoolActive } from '@/lib/parentAccount'
import { isValidNIS } from '@/lib/utils'

export type FormState = { error?: string } | null

export async function tambahSiswa(classId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, schools(code)')
    .eq('id', user.id)
    .single()
  const schoolCode = (profile?.schools as unknown as { code: string } | null)?.code
  if (!profile?.school_id || !schoolCode) return { error: 'Profil tidak ditemukan' }
  if (!(await isSchoolActive(supabase, profile.school_id))) {
    return { error: 'Masa aktif habis. Aktifkan lisensi di menu Pengaturan.' }
  }

  const { data: kelas } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('homeroom_teacher_id', user.id)
    .maybeSingle()
  if (!kelas) return { error: 'Kelas tidak ditemukan' }

  const name = String(formData.get('name') ?? '').trim()
  const nis = String(formData.get('nis') ?? '').trim()
  const nisn = String(formData.get('nisn') ?? '').trim()
  const gender = String(formData.get('gender') ?? '')

  if (!name) return { error: 'Nama siswa wajib diisi' }
  if (!nis) return { error: 'NIS wajib diisi (dipakai orang tua untuk login)' }
  if (!isValidNIS(nis)) return { error: 'NIS hanya boleh huruf, angka, titik, atau strip (tanpa spasi)' }

  const { data: student, error } = await supabase
    .from('students')
    .insert({
      school_id: profile.school_id,
      class_id: classId,
      name,
      student_number: nis,
      nisn: nisn || null,
      gender: gender === 'L' || gender === 'P' ? gender : null,
      status: 'active',
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: `NIS ${nis} sudah dipakai siswa lain` }
    return { error: error.message }
  }

  const parentErr = await ensureParentAccount(createAdminClient(), {
    studentId: student.id,
    studentName: name,
    nis,
    schoolId: profile.school_id,
    schoolCode,
  })
  if (parentErr) {
    await supabase.from('students').delete().eq('id', student.id)
    return { error: parentErr }
  }

  redirect(`/kelas/${classId}`)
}

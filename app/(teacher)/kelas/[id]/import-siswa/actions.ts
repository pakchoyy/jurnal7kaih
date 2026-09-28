'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface ImportResult {
  success: number
  skipped: number
  errors: string[]
}

export async function importSiswa(classId: string, rows: { name: string; nis: string; nisn?: string; gender?: string }[]): Promise<ImportResult> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: 0, skipped: 0, errors: ['Tidak terautentikasi'] }

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.school_id || profile.role !== 'teacher') {
    return { success: 0, skipped: 0, errors: ['Akses ditolak'] }
  }

  // Pastikan kelas milik guru ini
  const { data: kelas } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('homeroom_teacher_id', user.id)
    .single()
  if (!kelas) return { success: 0, skipped: 0, errors: ['Kelas tidak ditemukan'] }

  const admin = createAdminClient()
  let success = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    const name = row.name?.trim()
    const nis = row.nis?.toString().trim()
    if (!name || !nis) { errors.push(`Baris kosong (nama/NIS kosong) — dilewati`); skipped++; continue }

    // Insert siswa
    const { data: student, error: sErr } = await admin.from('students').insert({
      school_id: profile.school_id,
      class_id: classId,
      name,
      student_number: nis,
      nisn: row.nisn?.trim() || null,
      gender: row.gender === 'L' || row.gender === 'Laki-laki' ? 'L'
        : row.gender === 'P' || row.gender === 'Perempuan' ? 'P'
        : null,
      status: 'active',
    }).select('id').single()

    if (sErr) {
      if (sErr.code === '23505') { skipped++; continue }
      errors.push(`${name}: ${sErr.message}`)
      continue
    }

    // Buat akun ortu
    const parentEmail = `${nis}@7kaih.internal`
    let parentUserId: string | null = null

    const { data: existing } = await admin
      .from('users')
      .select('id')
      .eq('email', parentEmail)
      .maybeSingle()

    if (existing) {
      parentUserId = existing.id
    } else {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email: parentEmail,
        password: nis,
        email_confirm: true,
      })
      if (cErr) { errors.push(`${name}: gagal buat akun ortu — ${cErr.message}`); success++; continue }
      parentUserId = created.user.id
      await admin.from('users').insert({
        id: parentUserId,
        school_id: profile.school_id,
        role: 'parent',
        name: `Orang Tua ${name}`,
      })
    }

    if (student?.id && parentUserId) {
      await admin.from('student_parents').insert({
        student_id: student.id,
        user_id: parentUserId,
        relationship: 'Wali',
      }).select()
    }

    success++
  }

  return { success, skipped, errors }
}

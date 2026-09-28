'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureParentAccount, isSchoolActive } from '@/lib/parentAccount'
import { isValidNIS } from '@/lib/utils'

export interface ImportResult {
  success: number
  skipped: number
  errors: string[]
}

type Row = { name: string; nis: string; nisn?: string; gender?: string }

const MAX_ROWS = 500

function parseGender(g?: string): 'L' | 'P' | null {
  const v = (g ?? '').trim().toLowerCase()
  if (v === 'l' || v.startsWith('laki')) return 'L'
  if (v === 'p' || v.startsWith('perempuan')) return 'P'
  return null
}

export async function importSiswa(classId: string, rows: Row[]): Promise<ImportResult> {
  const fail = (msg: string): ImportResult => ({ success: 0, skipped: 0, errors: [msg] })

  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail('Sesi habis, silakan login ulang')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role, schools(code)')
    .eq('id', user.id)
    .single()
  const schoolCode = (profile?.schools as unknown as { code: string } | null)?.code
  if (!profile?.school_id || profile.role !== 'teacher' || !schoolCode) return fail('Akses ditolak')
  if (!(await isSchoolActive(supabase, profile.school_id))) {
    return fail('Masa aktif habis. Aktifkan lisensi di menu Pengaturan.')
  }
  if (!Array.isArray(rows) || rows.length === 0) return fail('File kosong')
  if (rows.length > MAX_ROWS) return fail(`Maksimal ${MAX_ROWS} siswa sekali import`)

  const { data: kelas } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('homeroom_teacher_id', user.id)
    .maybeSingle()
  if (!kelas) return fail('Kelas tidak ditemukan')

  const admin = createAdminClient()
  let success = 0
  let skipped = 0
  const errors: string[] = []

  for (const [i, row] of rows.entries()) {
    const line = i + 2
    const name = String(row.name ?? '').trim()
    const nis = String(row.nis ?? '').trim()
    if (!name || !nis) {
      errors.push(`Baris ${line}: nama/NIS kosong`)
      skipped++
      continue
    }
    if (!isValidNIS(nis)) {
      errors.push(`Baris ${line} (${name}): NIS "${nis}" tidak valid`)
      skipped++
      continue
    }

    const { data: student, error: sErr } = await supabase
      .from('students')
      .insert({
        school_id: profile.school_id,
        class_id: classId,
        name,
        student_number: nis,
        nisn: String(row.nisn ?? '').trim() || null,
        gender: parseGender(row.gender),
        status: 'active',
      })
      .select('id')
      .single()

    if (sErr) {
      skipped++
      errors.push(
        sErr.code === '23505'
          ? `Baris ${line} (${name}): NIS ${nis} sudah terdaftar`
          : `Baris ${line} (${name}): ${sErr.message}`,
      )
      continue
    }

    const parentErr = await ensureParentAccount(admin, {
      studentId: student.id,
      studentName: name,
      nis,
      schoolId: profile.school_id,
      schoolCode,
    })
    if (parentErr) {
      await supabase.from('students').delete().eq('id', student.id)
      skipped++
      errors.push(`Baris ${line}: ${parentErr}`)
      continue
    }

    success++
  }

  return { success, skipped, errors }
}

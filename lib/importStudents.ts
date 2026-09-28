import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ensureParentAccount } from '@/lib/parentAccount'
import { isValidNIS } from '@/lib/utils'

export type StudentRow = { name: string; nis: string; nisn?: string; gender?: string; line?: number }

export interface ImportTally {
  success: number
  skipped: number
  errors: string[]
}

function parseGender(g?: string): 'L' | 'P' | null {
  const v = (g ?? '').trim().toLowerCase()
  if (v === 'l' || v.startsWith('laki')) return 'L'
  if (v === 'p' || v.startsWith('perempuan')) return 'P'
  return null
}

/** Masukkan siswa ke satu kelas + buat akun ortu. `supabase` = client guru (RLS). */
export async function insertStudents(
  supabase: SupabaseClient,
  admin: SupabaseClient,
  ctx: { schoolId: string; schoolCode: string; classId: string },
  rows: StudentRow[],
  tally: ImportTally,
) {
  for (const [i, row] of rows.entries()) {
    const line = row.line ?? i + 2
    const name = String(row.name ?? '').trim()
    const nis = String(row.nis ?? '').trim()
    if (!name || !nis) {
      tally.errors.push(`Baris ${line}: nama/NIS kosong`)
      tally.skipped++
      continue
    }
    if (!isValidNIS(nis)) {
      tally.errors.push(`Baris ${line} (${name}): NIS "${nis}" tidak valid`)
      tally.skipped++
      continue
    }

    const { data: student, error } = await supabase
      .from('students')
      .insert({
        school_id: ctx.schoolId,
        class_id: ctx.classId,
        name,
        student_number: nis,
        nisn: String(row.nisn ?? '').trim() || null,
        gender: parseGender(row.gender),
        status: 'active',
      })
      .select('id')
      .single()

    if (error) {
      tally.skipped++
      tally.errors.push(
        error.code === '23505'
          ? `Baris ${line} (${name}): NIS ${nis} sudah terdaftar`
          : `Baris ${line} (${name}): ${error.message}`,
      )
      continue
    }

    const parentErr = await ensureParentAccount(admin, {
      studentId: student.id,
      studentName: name,
      nis,
      schoolId: ctx.schoolId,
      schoolCode: ctx.schoolCode,
    })
    if (parentErr) {
      await supabase.from('students').delete().eq('id', student.id)
      tally.skipped++
      tally.errors.push(`Baris ${line}: ${parentErr}`)
      continue
    }
    tally.success++
  }
}

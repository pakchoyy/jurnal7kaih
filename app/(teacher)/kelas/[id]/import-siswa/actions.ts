'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSchoolActive } from '@/lib/parentAccount'
import { insertStudents, type ImportTally, type StudentRow } from '@/lib/importStudents'

export type ImportResult = ImportTally

// Klien mengirim per potongan agar tiap panggilan jauh di bawah batas waktu server.
const MAX_ROWS = 60

export async function importSiswa(classId: string, rows: StudentRow[]): Promise<ImportResult> {
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
  if (rows.length > MAX_ROWS) return fail(`Maksimal ${MAX_ROWS} siswa per kiriman`)

  const { data: kelas } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('homeroom_teacher_id', user.id)
    .maybeSingle()
  if (!kelas) return fail('Kelas tidak ditemukan')

  const tally: ImportTally = { success: 0, skipped: 0, errors: [] }
  await insertStudents(supabase, createAdminClient(), { schoolId: profile.school_id, schoolCode, classId }, rows, tally)
  return tally
}

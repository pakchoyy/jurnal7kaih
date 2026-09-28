'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSchoolActive } from '@/lib/parentAccount'
import { insertStudents, type ImportTally, type StudentRow } from '@/lib/importStudents'

export type ClassRow = StudentRow & { kelas: string; tingkat?: string }
export type ImportKelasResult = ImportTally & { classesCreated: number }

// Klien mengirim per potongan agar tiap panggilan jauh di bawah batas waktu server.
const MAX_ROWS = 60

function guessGrade(name: string, tingkat?: string): number {
  const n = parseInt(String(tingkat ?? '').replace(/\D/g, ''), 10) || parseInt(name.replace(/\D/g, ''), 10)
  return n >= 1 && n <= 12 ? n : 1
}

export async function importKelas(rows: ClassRow[]): Promise<ImportKelasResult> {
  const fail = (msg: string): ImportKelasResult => ({ success: 0, skipped: 0, errors: [msg], classesCreated: 0 })

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
  if (rows.length > MAX_ROWS) return fail(`Maksimal ${MAX_ROWS} baris per kiriman`)

  const { data: ay } = await supabase
    .from('academic_years')
    .select('id')
    .eq('school_id', profile.school_id)
    .eq('is_active', true)
    .maybeSingle()
  if (!ay) return fail('Tahun ajaran aktif tidak ditemukan')

  const groups = new Map<string, { tingkat?: string; rows: StudentRow[] }>()
  const tally: ImportKelasResult = { success: 0, skipped: 0, errors: [], classesCreated: 0 }
  rows.forEach((r, i) => {
    const kelas = String(r.kelas ?? '').trim().toUpperCase().slice(0, 30)
    if (!kelas) {
      tally.skipped++
      tally.errors.push(`Baris ${i + 2}: kolom Kelas kosong`)
      return
    }
    const g = groups.get(kelas) ?? { tingkat: r.tingkat, rows: [] }
    g.rows.push({ ...r, line: i + 2 })
    groups.set(kelas, g)
  })

  const admin = createAdminClient()
  for (const [name, g] of Array.from(groups.entries())) {
    const { data: existing } = await supabase
      .from('classes')
      .select('id, homeroom_teacher_id')
      .eq('school_id', profile.school_id)
      .eq('academic_year_id', ay.id)
      .eq('name', name)
      .maybeSingle()

    let classId = existing?.id as string | undefined
    if (existing && existing.homeroom_teacher_id !== user.id) {
      tally.skipped += g.rows.length
      tally.errors.push(`Kelas ${name} milik guru lain — ${g.rows.length} baris dilewati`)
      continue
    }
    if (!classId) {
      const { data: created, error } = await supabase
        .from('classes')
        .insert({
          school_id: profile.school_id,
          academic_year_id: ay.id,
          name,
          grade: guessGrade(name, g.tingkat),
          homeroom_teacher_id: user.id,
        })
        .select('id')
        .single()
      if (error || !created) {
        tally.skipped += g.rows.length
        tally.errors.push(`Kelas ${name} gagal dibuat: ${error?.message ?? ''}`)
        continue
      }
      classId = created.id
      tally.classesCreated++
    }

    await insertStudents(supabase, admin, { schoolId: profile.school_id, schoolCode, classId: classId! }, g.rows, tally)
  }

  revalidatePath('/kelas', 'layout')
  return tally
}

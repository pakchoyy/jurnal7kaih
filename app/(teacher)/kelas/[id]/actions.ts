'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PHOTO_BUCKET } from '@/lib/photos'
import { revalidatePath } from 'next/cache'

export interface HapusKelasResult {
  ok: boolean
  error?: string
  students?: number
  journals?: number
}

/**
 * HARD DELETE kelas: siswa di dalamnya ikut dihapus permanen beserta
 * seluruh jurnal, entry, foto, pesan, dan catatan gurunya
 * (diurus ON DELETE CASCADE). Akun login ortu TIDAK dihapus.
 */
export async function hapusKelas(classId: string): Promise<HapusKelasResult> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Belum login' }

  // Pastikan kelas milik guru ini
  const { data: own } = await supabase
    .from('classes')
    .select('id, name')
    .eq('id', classId)
    .eq('homeroom_teacher_id', user.id)
    .maybeSingle()
  if (!own) return { ok: false, error: 'Kelas tidak ditemukan' }

  // Admin client: hapus berantai (melewati RLS, kepemilikan sudah dicek di atas).
  const admin = createAdminClient()

  const { data: students } = await admin.from('students').select('id').eq('class_id', classId)
  const studentIds = (students ?? []).map((s) => s.id)
  let journalCount = 0
  let photoPaths: string[] = []

  if (studentIds.length > 0) {
    const { data: journals } = await admin
      .from('journals')
      .select('id')
      .in('student_id', studentIds)
    const journalIds = (journals ?? []).map((j) => j.id)
    journalCount = journalIds.length

    if (journalIds.length > 0) {
      const { data: photos } = await admin
        .from('journal_photos')
        .select('path')
        .in('journal_id', journalIds)
      photoPaths = (photos ?? []).map((p) => p.path)
    }

    // Hapus file foto di storage (abaikan gagal — baris DB tetap di-cascade).
    for (let i = 0; i < photoPaths.length; i += 100) {
      await admin.storage.from(PHOTO_BUCKET).remove(photoPaths.slice(i, i + 100))
    }

    // Hapus siswa → CASCADE ke jurnal, entry, foto, pesan, catatan guru,
    // relasi ortu, dan kode aktivasi.
    const { error: sErr } = await admin.from('students').delete().in('id', studentIds)
    if (sErr) return { ok: false, error: sErr.message }
  }

  const { error: cErr } = await admin.from('classes').delete().eq('id', classId)
  if (cErr) return { ok: false, error: cErr.message }

  revalidatePath('/kelas')
  return { ok: true, students: studentIds.length, journals: journalCount }
}

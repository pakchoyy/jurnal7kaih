'use server'

import { createServerClient } from '@/lib/supabase/server'

export interface AddNoteResult {
  ok: boolean
  error?: string
}

export async function addTeacherNote(
  studentId: string,
  journalId: string | null,
  note: string,
): Promise<AddNoteResult> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Belum login' }
  if (!note.trim()) return { ok: false, error: 'Catatan kosong' }

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()
  if (!profile?.school_id) return { ok: false, error: 'Profil tidak ditemukan' }

  const { error } = await supabase.from('teacher_notes').insert({
    school_id: profile.school_id,
    student_id: studentId,
    journal_id: journalId,
    teacher_id: user.id,
    note: note.trim(),
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

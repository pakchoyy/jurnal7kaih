'use server'

import { createServerClient } from '@/lib/supabase/server'
import { validateHabitNote } from '@/lib/schemas/habits'
import { todayISO } from '@/lib/utils'
import { isSchoolActive } from '@/lib/parentAccount'

export interface SaveJournalInput {
  studentId: string
  entries: Array<{ habitId: string; slug: string; status: 'done' | 'not_done'; note: unknown }>
  parentNote?: string
  submit: boolean
}

export interface SaveJournalResult {
  ok: boolean
  journalId?: string
  error?: string
}

export async function saveJournal(input: SaveJournalInput): Promise<SaveJournalResult> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Belum login' }

  const { data: link } = await supabase
    .from('student_parents')
    .select('student_id, students(school_id)')
    .eq('user_id', user.id)
    .eq('student_id', input.studentId)
    .maybeSingle()
  if (!link) return { ok: false, error: 'Anda tidak punya akses ke siswa ini' }

  const schoolId = (link.students as unknown as { school_id: string } | null)?.school_id
  if (!schoolId) return { ok: false, error: 'Data sekolah tidak ditemukan' }
  if (!(await isSchoolActive(supabase, schoolId))) {
    return { ok: false, error: 'Langganan sekolah sudah berakhir. Hubungi wali kelas.' }
  }

  const journalDate = todayISO()

  const notes: Array<string | null> = []
  for (const e of input.entries) {
    try {
      notes.push(e.note != null ? validateHabitNote(e.slug, e.note) : null)
    } catch (err) {
      return { ok: false, error: `Isian "${e.slug.replace('-', ' ')}" belum benar: ${(err as Error).message}` }
    }
    if (e.status !== 'done' && e.status !== 'not_done') return { ok: false, error: 'Status tidak valid' }
  }

  const { data: journal, error: jErr } = await supabase
    .from('journals')
    .upsert(
      {
        school_id: schoolId,
        student_id: input.studentId,
        journal_date: journalDate,
        created_by: user.id,
        parent_note: input.parentNote?.trim().slice(0, 1000) || null,
        status: input.submit ? 'submitted' : 'draft',
        submitted_at: input.submit ? new Date().toISOString() : null,
      },
      { onConflict: 'student_id,journal_date' },
    )
    .select('id')
    .single()
  if (jErr || !journal) return { ok: false, error: jErr?.message ?? 'Gagal simpan jurnal' }

  const rows = input.entries.map((e, i) => ({
    journal_id: journal.id,
    habit_id: e.habitId,
    status: e.status,
    note: notes[i],
  }))

  const { error: eErr } = await supabase
    .from('journal_entries')
    .upsert(rows, { onConflict: 'journal_id,habit_id' })
  if (eErr) return { ok: false, error: eErr.message }

  return { ok: true, journalId: journal.id }
}

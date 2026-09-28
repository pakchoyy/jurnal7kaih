'use server'

import { createServerClient } from '@/lib/supabase/server'
import { validateHabitNote } from '@/lib/schemas/habits'
import { todayISO } from '@/lib/utils'

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

  const journalDate = todayISO()

  const { data: journal, error: jErr } = await supabase
    .from('journals')
    .upsert(
      {
        school_id: schoolId,
        student_id: input.studentId,
        journal_date: journalDate,
        created_by: user.id,
        parent_note: input.parentNote ?? null,
        status: input.submit ? 'submitted' : 'draft',
        submitted_at: input.submit ? new Date().toISOString() : null,
      },
      { onConflict: 'student_id,journal_date' },
    )
    .select('id')
    .single()
  if (jErr || !journal) return { ok: false, error: jErr?.message ?? 'Gagal simpan jurnal' }

  const rows = []
  for (const e of input.entries) {
    let noteStr: string | null = null
    if (e.status === 'done' && e.note != null) {
      try {
        noteStr = validateHabitNote(e.slug, e.note)
      } catch (err) {
        return { ok: false, error: `Data "${e.slug}" tidak valid: ${(err as Error).message}` }
      }
    }
    rows.push({
      journal_id: journal.id,
      habit_id: e.habitId,
      status: e.status,
      note: noteStr,
    })
  }

  const { error: eErr } = await supabase
    .from('journal_entries')
    .upsert(rows, { onConflict: 'journal_id,habit_id' })
  if (eErr) return { ok: false, error: eErr.message }

  return { ok: true, journalId: journal.id }
}

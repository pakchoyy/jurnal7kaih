'use server'

import { createServerClient } from '@/lib/supabase/server'
import { validateHabitNote } from '@/lib/schemas/habits'
import { todayISO } from '@/lib/utils'
import { isDateFillable } from '@/lib/journalWindow'
import { isSchoolActive } from '@/lib/parentAccount'

export interface SaveJournalInput {
  studentId: string
  /** Tanggal jurnal YYYY-MM-DD. Bila kosong, pakai hari ini. */
  journalDate?: string
  entries: Array<{ habitId: string; slug: string; status: 'done' | 'not_done'; note: unknown }>
  parentNote?: string
  submit: boolean
}

export interface SaveJournalResult {
  ok: boolean
  journalId?: string
  /** True bila jurnal yang sudah direview guru diubah sehingga kembali "submitted". */
  reopened?: boolean
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

  const journalDate = input.journalDate || todayISO()
  const check = isDateFillable(journalDate)
  if (!check.ok) return { ok: false, error: check.reason ?? 'Tanggal tidak valid' }

  // Jurnal yang sudah direview guru boleh diubah ortu;
  // statusnya kembali jadi "submitted" agar guru mengecek ulang.
  const { data: existing } = await supabase
    .from('journals')
    .select('id, status')
    .eq('student_id', input.studentId)
    .eq('journal_date', journalDate)
    .maybeSingle()
  const wasReviewed = existing?.status === 'reviewed'
  // Edit apa pun pada jurnal yang sudah direview → kembali "submitted"
  // agar guru mengecek ulang.
  const newStatus = input.submit || wasReviewed ? 'submitted' : (existing?.status ?? 'draft')

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
        status: newStatus,
        ...(input.submit || wasReviewed
          ? { submitted_at: new Date().toISOString() }
          : !existing
            ? { submitted_at: null as string | null }
            : {}),
        ...(wasReviewed ? { reviewed_at: null as string | null, reviewed_by: null as string | null } : {}),
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

  return { ok: true, journalId: journal.id, reopened: wasReviewed || undefined }
}

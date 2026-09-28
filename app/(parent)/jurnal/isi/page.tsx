import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { todayISO } from '@/lib/utils'
import { itemsForHabit } from '@/lib/habitItems'
import { JurnalForm, type HabitRow, type ExistingEntry } from './JurnalForm'

export default async function IsiJurnalPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: links } = await supabase
    .from('student_parents')
    .select('student_id, students(name, school_id)')
    .eq('user_id', user.id)
    .limit(1)

  const first = links?.[0]
  if (!first) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-base text-ink-2">Akun belum terhubung ke data anak.</p>
        <p className="mt-1 text-sm text-ink-3">Silakan hubungi wali kelas.</p>
      </div>
    )
  }

  const studentId = first.student_id
  const student = first.students as unknown as { name: string; school_id: string } | null

  const [{ data: habits }, { data: schoolItems }, { data: journal }] = await Promise.all([
    supabase.from('habits').select('id, slug, name, icon, color').eq('is_active', true).order('sort_order'),
    supabase
      .from('school_habit_items')
      .select('habit_id, label, sort_order')
      .eq('school_id', student?.school_id ?? ''),
    supabase
      .from('journals')
      .select('id, parent_note')
      .eq('student_id', studentId)
      .eq('journal_date', todayISO())
      .maybeSingle(),
  ])

  let entries: ExistingEntry[] = []
  if (journal) {
    const { data } = await supabase
      .from('journal_entries')
      .select('habit_id, status, note')
      .eq('journal_id', journal.id)
    entries = (data ?? []) as ExistingEntry[]
  }

  const habitRows = (habits ?? []) as HabitRow[]
  const habitItems = Object.fromEntries(
    habitRows.map((h) => [h.id, itemsForHabit(h.slug, h.id, schoolItems ?? [])]),
  )

  return (
    <JurnalForm
      studentId={studentId}
      studentName={student?.name ?? 'Siswa'}
      habits={habitRows}
      habitItems={habitItems}
      existingEntries={entries}
      initialParentNote={journal?.parent_note ?? ''}
    />
  )
}

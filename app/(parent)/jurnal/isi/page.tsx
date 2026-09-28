import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { todayISO } from '@/lib/utils'
import { itemsForHabit } from '@/lib/habitItems'
import { getChildren } from '@/lib/activeChild'
import { JurnalForm, type HabitRow, type ExistingEntry } from './JurnalForm'

export default async function IsiJurnalPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { active } = await getChildren(supabase, user.id)
  if (!active) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-base text-ink-2">Akun belum terhubung ke data anak.</p>
        <p className="mt-1 text-sm text-ink-3">Silakan hubungi wali kelas.</p>
      </div>
    )
  }

  const studentId = active.id
  const { data: me } = await supabase.from('users').select('school_id').eq('id', user.id).single()

  const [{ data: habits }, { data: schoolItems }, { data: journal }] = await Promise.all([
    supabase.from('habits').select('id, slug, name, icon, color').eq('is_active', true).order('sort_order'),
    supabase
      .from('school_habit_items')
      .select('habit_id, label, sort_order')
      .eq('school_id', me?.school_id ?? ''),
    supabase
      .from('journals')
      .select('id, parent_note')
      .eq('student_id', studentId)
      .eq('journal_date', todayISO())
      .maybeSingle(),
  ])

  let entries: ExistingEntry[] = []
  let photoCount = 0
  if (journal) {
    const { count } = await supabase
      .from('journal_photos')
      .select('id', { count: 'exact', head: true })
      .eq('journal_id', journal.id)
    photoCount = count ?? 0
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
      studentName={active.name}
      habits={habitRows}
      habitItems={habitItems}
      existingEntries={entries}
      initialParentNote={journal?.parent_note ?? ''}
      existingPhotoCount={photoCount}
    />
  )
}

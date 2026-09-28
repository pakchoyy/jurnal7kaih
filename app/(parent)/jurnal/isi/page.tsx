import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { todayISO } from '@/lib/utils'
import { JurnalForm, type HabitRow, type ExistingEntry } from './JurnalForm'

export default async function IsiJurnalPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: links } = await supabase
    .from('student_parents')
    .select('student_id, students(name)')
    .eq('user_id', user.id)
    .limit(1)

  const first = links?.[0]
  if (!first) {
    return (
      <div className="px-5 py-6">
        <p className="text-gray-500">Belum ada anak terhubung. Tambahkan lewat menu Profil.</p>
      </div>
    )
  }

  const studentId = first.student_id
  const studentName = (first.students as unknown as { name: string } | null)?.name ?? 'Siswa'

  const { data: habits } = await supabase
    .from('habits')
    .select('id, slug, name, icon, color')
    .eq('is_active', true)
    .order('sort_order')

  const { data: journal } = await supabase
    .from('journals')
    .select('id')
    .eq('student_id', studentId)
    .eq('journal_date', todayISO())
    .maybeSingle()

  let entries: ExistingEntry[] = []
  if (journal) {
    const { data } = await supabase
      .from('journal_entries')
      .select('habit_id, status, note')
      .eq('journal_id', journal.id)
    entries = (data ?? []) as ExistingEntry[]
  }

  return (
    <div className="px-5 py-6">
      <JurnalForm
        studentId={studentId}
        studentName={studentName}
        habits={(habits ?? []) as HabitRow[]}
        existingEntries={entries}
      />
    </div>
  )
}

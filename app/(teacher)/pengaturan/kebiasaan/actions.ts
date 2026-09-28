'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { MAX_ITEMS_PER_HABIT, MAX_ITEM_LENGTH } from '@/lib/habitItems'

export async function simpanItemKebiasaan(habitId: string, labels: string[]) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis, silakan login ulang' }

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.school_id || profile.role !== 'teacher') return { error: 'Akses ditolak' }

  const clean: string[] = []
  for (const raw of Array.isArray(labels) ? labels : []) {
    const label = String(raw).trim().replace(/\s+/g, ' ').slice(0, MAX_ITEM_LENGTH)
    if (label && !clean.some((c) => c.toLowerCase() === label.toLowerCase())) clean.push(label)
  }
  if (clean.length > MAX_ITEMS_PER_HABIT) return { error: `Maksimal ${MAX_ITEMS_PER_HABIT} pilihan` }

  const { error: dErr } = await supabase
    .from('school_habit_items')
    .delete()
    .eq('school_id', profile.school_id)
    .eq('habit_id', habitId)
  if (dErr) return { error: dErr.message }

  if (clean.length) {
    const { error } = await supabase.from('school_habit_items').insert(
      clean.map((label, i) => ({
        school_id: profile.school_id,
        habit_id: habitId,
        label,
        sort_order: i,
      })),
    )
    if (error) return { error: error.message }
  }

  revalidatePath('/pengaturan/kebiasaan')
  revalidatePath('/jurnal/isi')
  return { ok: true }
}

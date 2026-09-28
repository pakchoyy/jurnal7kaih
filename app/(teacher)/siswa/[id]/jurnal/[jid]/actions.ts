'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function tandaiDicek(journalId: string, studentId: string) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('journals')
    .update({ status: 'reviewed', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq('id', journalId)
    .eq('status', 'submitted')

  revalidatePath(`/siswa/${studentId}`, 'layout')
}

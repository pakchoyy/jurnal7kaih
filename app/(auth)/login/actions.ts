'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { parentEmail } from '@/lib/parentAccount'
import { isValidNIS } from '@/lib/utils'

export type ParentLoginOption = { email: string; school: string }

export async function cariAkunOrtu(nis: string): Promise<ParentLoginOption[]> {
  const clean = String(nis ?? '').trim()
  if (!isValidNIS(clean)) return []

  const { data } = await createAdminClient()
    .from('students')
    .select('schools(name, code)')
    .eq('student_number', clean)
    .eq('status', 'active')
    .limit(10)

  const bySchool = new Map<string, ParentLoginOption>()
  for (const row of data ?? []) {
    const s = row.schools as unknown as { name: string; code: string } | null
    if (s?.code) bySchool.set(s.code, { email: parentEmail(clean, s.code), school: s.name })
  }
  return Array.from(bySchool.values())
}

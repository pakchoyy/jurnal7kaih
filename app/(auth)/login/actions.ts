'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { parentEmail } from '@/lib/parentAccount'
import { isValidNIS, toAuthPassword } from '@/lib/utils'

export type ParentLoginOption = { email: string; school: string }

export async function cariAkunOrtu(nis: string): Promise<ParentLoginOption[]> {
  const clean = String(nis ?? '').trim()
  if (!isValidNIS(clean)) return []

  const admin = createAdminClient()
  const { data } = await admin
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
  const options = Array.from(bySchool.values())

  // Password ortu dikunci = NIS. Akun yang dulu sempat mengganti password dikembalikan.
  const { data: changed } = await admin
    .from('users')
    .select('id')
    .in('email', options.map((o) => o.email))
    .eq('password_changed', true)
  for (const u of changed ?? []) {
    await admin.auth.admin.updateUserById(u.id, { password: toAuthPassword(clean) })
    await admin.from('users').update({ password_changed: false }).eq('id', u.id)
  }

  return options
}

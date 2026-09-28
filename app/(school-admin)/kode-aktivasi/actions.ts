'use server'

import { createServerClient } from '@/lib/supabase/server'
import { generateActivationCode } from '@/lib/utils'

export interface GenerateCodeResult {
  ok: boolean
  code?: string
  error?: string
}

export async function generateActivationCodeAction(studentId: string): Promise<GenerateCodeResult> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Belum login' }

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'school_admin' || !profile.school_id) {
    return { ok: false, error: 'Tidak punya akses' }
  }

  const code = generateActivationCode(8)

  const { error } = await supabase.from('parent_activation_codes').insert({
    school_id: profile.school_id,
    student_id: studentId,
    code,
    created_by: user.id,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true, code }
}

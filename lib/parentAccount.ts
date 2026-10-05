import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { BILLING_ENABLED } from '@/lib/billing'
import { toAuthPassword } from '@/lib/utils'

// NIS hanya unik per sekolah, jadi kode sekolah wajib ikut di email login.
export function parentEmail(nis: string, schoolCode: string): string {
  return `${nis}.${schoolCode}@7kaih.internal`.toLowerCase()
}

export async function ensureParentAccount(
  admin: SupabaseClient,
  p: { studentId: string; studentName: string; nis: string; schoolId: string; schoolCode: string },
): Promise<string | null> {
  const email = parentEmail(p.nis, p.schoolCode)

  const { data: existing } = await admin.from('users').select('id').eq('email', email).maybeSingle()
  let uid = existing?.id as string | undefined

  if (!uid) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: toAuthPassword(p.nis),
      email_confirm: true,
    })
    if (error) {
      return `Akun ortu ${p.studentName} gagal dibuat: ${error.message}`
    }
    uid = data.user.id

    const { error: pErr } = await admin.from('users').insert({
      id: uid,
      school_id: p.schoolId,
      role: 'parent',
      name: `Orang Tua ${p.studentName}`,
      email,
    })
    if (pErr) {
      await admin.auth.admin.deleteUser(uid)
      return `Akun ortu ${p.studentName} gagal dibuat: ${pErr.message}`
    }
  }

  const { error: lErr } = await admin
    .from('student_parents')
    .upsert(
      { student_id: p.studentId, user_id: uid, relationship: 'Wali' },
      { onConflict: 'student_id,user_id', ignoreDuplicates: true },
    )
  return lErr ? `Gagal menautkan ortu ${p.studentName}: ${lErr.message}` : null
}

export async function isSchoolActive(supabase: SupabaseClient, schoolId: string): Promise<boolean> {
  // Mode lomba/demo: gate langganan nonaktif, semua sekolah dianggap aktif.
  if (!BILLING_ENABLED) return true
  const { data } = await supabase.from('schools').select('active_until').eq('id', schoolId).single()
  return !!data?.active_until && new Date(data.active_until).getTime() > Date.now()
}

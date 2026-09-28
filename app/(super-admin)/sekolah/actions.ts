'use server'

import { createServerClient } from '@/lib/supabase/server'
import { generateActivationCode } from '@/lib/utils'

export interface ExtendResult {
  ok: boolean
  error?: string
}

/**
 * Super Admin: Tambah sekolah manual (cadangan)
 */
export async function createSchoolManual(
  name: string,
  plan: 'trial' | 'semester' | 'annual' | 'lifetime',
  phone?: string,
): Promise<ExtendResult> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Belum login' }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'super_admin') return { ok: false, error: 'Bukan Super Admin' }

  const schoolCode = 'SCH-' + generateActivationCode(6)
  const now = new Date()
  const activeUntil = new Date(now)
  if (plan === 'semester') activeUntil.setMonth(activeUntil.getMonth() + 6)
  else if (plan === 'annual') activeUntil.setFullYear(activeUntil.getFullYear() + 1)
  else if (plan === 'lifetime') activeUntil.setFullYear(activeUntil.getFullYear() + 99)
  else activeUntil.setDate(activeUntil.getDate() + 14) // trial

  const { error } = await supabase.from('schools').insert({
    name,
    code: schoolCode,
    phone: phone || null,
    plan,
    active_until: activeUntil.toISOString(),
    status: 'active',
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Super Admin: Perpanjang masa aktif sekolah (+6 bulan / 1 semester)
 */
export async function extendSchoolLicense(
  schoolId: string,
  months: number = 6,
): Promise<ExtendResult> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Belum login' }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'super_admin') return { ok: false, error: 'Bukan Super Admin' }

  const { data: school } = await supabase
    .from('schools')
    .select('active_until')
    .eq('id', schoolId)
    .single()

  const currentUntil = school?.active_until ? new Date(school.active_until) : new Date()
  const baseDate = currentUntil > new Date() ? currentUntil : new Date()
  baseDate.setMonth(baseDate.getMonth() + months)

  const { error } = await supabase
    .from('schools')
    .update({
      active_until: baseDate.toISOString(),
      plan: months >= 12 ? 'annual' : 'semester',
      status: 'active',
    })
    .eq('id', schoolId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

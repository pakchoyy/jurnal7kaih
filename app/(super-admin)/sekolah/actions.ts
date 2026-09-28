'use server'

import { createServerClient } from '@/lib/supabase/server'
import type { RegisterSchoolInput } from '@/lib/schemas/license'
import { createSchoolWithTeacher, type SchoolPlan } from '@/lib/schoolRegistration'

export interface ExtendResult {
  ok: boolean
  error?: string
}

/**
 * Super Admin: Tambah sekolah + akun guru secara manual (cadangan)
 */
export async function createSchoolManual(
  input: RegisterSchoolInput,
  plan: SchoolPlan,
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

  return createSchoolWithTeacher(input, plan)
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

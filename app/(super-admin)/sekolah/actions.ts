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

export type LicenseAdjust = 'minus1' | 'minus6' | 'trial' | 'expire'

/**
 * Super Admin: kurangi masa aktif, reset ke trial 14 hari, atau nonaktifkan sekarang.
 */
export async function adjustSchoolLicense(schoolId: string, mode: LicenseAdjust): Promise<ExtendResult> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Belum login' }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return { ok: false, error: 'Bukan Super Admin' }

  const { data: school } = await supabase.from('schools').select('active_until, plan').eq('id', schoolId).single()
  if (!school) return { ok: false, error: 'Sekolah tidak ditemukan' }

  const now = new Date()
  let until: Date
  let plan = school.plan as string
  if (mode === 'trial') {
    until = new Date(now)
    until.setDate(until.getDate() + 14)
    plan = 'trial'
  } else if (mode === 'expire') {
    until = new Date(now.getTime() - 60_000)
  } else {
    until = school.active_until ? new Date(school.active_until) : new Date(now)
    until.setMonth(until.getMonth() - (mode === 'minus6' ? 6 : 1))
  }

  const { error } = await supabase
    .from('schools')
    .update({ active_until: until.toISOString(), plan })
    .eq('id', schoolId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

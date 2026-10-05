'use server'

import { BILLING_ENABLED } from '@/lib/billing'
import type { RegisterSchoolInput } from '@/lib/schemas/license'
import { createSchoolWithTeacher, type RegisterSchoolResult } from '@/lib/schoolRegistration'

export async function registerSchoolSelf(input: RegisterSchoolInput): Promise<RegisterSchoolResult> {
  if (!BILLING_ENABLED) return { ok: false, error: 'Pendaftaran mandiri sedang ditutup.' }
  return createSchoolWithTeacher(input, 'trial')
}

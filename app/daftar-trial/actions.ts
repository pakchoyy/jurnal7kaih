'use server'

import type { RegisterSchoolInput } from '@/lib/schemas/license'
import { createSchoolWithTeacher, type RegisterSchoolResult } from '@/lib/schoolRegistration'

export async function registerSchoolSelf(input: RegisterSchoolInput): Promise<RegisterSchoolResult> {
  return createSchoolWithTeacher(input, 'trial')
}

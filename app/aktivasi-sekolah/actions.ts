'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { registerSchoolSchema, type RegisterSchoolInput } from '@/lib/schemas/license'
import { generateActivationCode } from '@/lib/utils'

export interface RegisterSchoolResult {
  ok: boolean
  error?: string
}

export async function registerSchoolSelf(
  input: RegisterSchoolInput,
  plan: 'semester' | 'trial',
): Promise<RegisterSchoolResult> {
  const parsed = registerSchoolSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Data tidak valid' }
  }

  const { schoolName, adminName, email, password, phone } = parsed.data
  const admin = createAdminClient()

  // 1. Buat kode unik sekolah (6 karakter)
  const schoolCode = 'SCH-' + generateActivationCode(6)

  // Masa aktif: semester = 6 bulan, trial = 14 hari
  const now = new Date()
  const activeUntil = new Date(now)
  if (plan === 'semester') {
    activeUntil.setMonth(activeUntil.getMonth() + 6)
  } else {
    activeUntil.setDate(activeUntil.getDate() + 14)
  }

  // 2. Insert row sekolah
  const { data: school, error: sErr } = await admin
    .from('schools')
    .insert({
      name: schoolName,
      code: schoolCode,
      phone: phone || null,
      plan,
      active_until: activeUntil.toISOString(),
      buyer_email: email,
      status: 'active',
    })
    .select('id')
    .single()

  if (sErr || !school) {
    return { ok: false, error: sErr?.message ?? 'Gagal mebuat data sekolah' }
  }

  // 3. Buat auth user via Admin API
  const { data: created, error: uErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (uErr) {
    await admin.from('schools').delete().eq('id', school.id)
    if (uErr.message.toLowerCase().includes('already')) {
      return { ok: false, error: 'Email sudah terdaftar, silakan login' }
    }
    return { ok: false, error: uErr.message }
  }

  const uid = created.user.id

  // 4. Buat profile admin sekolah di public.users
  const { error: pErr } = await admin.from('users').insert({
    id: uid,
    school_id: school.id,
    name: adminName,
    email,
    phone: phone || null,
    role: 'school_admin',
    status: 'active',
  })

  if (pErr) {
    await admin.from('schools').delete().eq('id', school.id)
    await admin.auth.admin.deleteUser(uid)
    return { ok: false, error: pErr.message }
  }

  return { ok: true }
}

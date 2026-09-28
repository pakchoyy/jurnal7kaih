import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { registerSchoolSchema, type RegisterSchoolInput } from '@/lib/schemas/license'
import { generateActivationCode, normalizeWA } from '@/lib/utils'

export type SchoolPlan = 'trial' | 'semester' | 'annual'

export interface RegisterSchoolResult {
  ok: boolean
  error?: string
}

function activeUntilFor(plan: SchoolPlan, from: Date): Date {
  const d = new Date(from)
  if (plan === 'trial') d.setDate(d.getDate() + 14)
  else d.setMonth(d.getMonth() + (plan === 'annual' ? 12 : 6))
  return d
}

export async function createSchoolWithTeacher(
  input: RegisterSchoolInput,
  plan: SchoolPlan,
): Promise<RegisterSchoolResult> {
  const parsed = registerSchoolSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Data tidak valid' }
  }

  const { schoolName, adminName, email, password, phone } = parsed.data
  const admin = createAdminClient()
  const now = new Date()

  const { data: school, error: sErr } = await admin
    .from('schools')
    .insert({
      name: schoolName,
      code: 'SCH-' + generateActivationCode(6),
      phone: phone || null,
      plan,
      active_until: activeUntilFor(plan, now).toISOString(),
      buyer_email: email,
      status: 'active',
    })
    .select('id')
    .single()
  if (sErr || !school) return { ok: false, error: sErr?.message ?? 'Gagal membuat data sekolah' }

  const { data: created, error: uErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (uErr) {
    await admin.from('schools').delete().eq('id', school.id)
    return {
      ok: false,
      error: uErr.message.toLowerCase().includes('already')
        ? 'Email sudah terdaftar, silakan login'
        : uErr.message,
    }
  }
  const uid = created.user.id

  // Hapus akun dulu (users ikut terhapus via cascade) baru sekolah, karena users mereferensikan sekolah.
  const rollback = async () => {
    await admin.auth.admin.deleteUser(uid)
    await admin.from('schools').delete().eq('id', school.id)
  }

  const { error: pErr } = await admin.from('users').insert({
    id: uid,
    school_id: school.id,
    name: adminName,
    email,
    phone: phone || null,
    whatsapp: phone ? normalizeWA(phone) : null,
    role: 'teacher',
    status: 'active',
  })
  if (pErr) {
    await rollback()
    return { ok: false, error: pErr.message }
  }

  const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  const { error: ayErr } = await admin.from('academic_years').insert({
    school_id: school.id,
    name: `${startYear}/${startYear + 1}`,
    start_date: `${startYear}-07-01`,
    end_date: `${startYear + 1}-06-30`,
    is_active: true,
  })
  if (ayErr) {
    await rollback()
    return { ok: false, error: ayErr.message }
  }

  return { ok: true }
}

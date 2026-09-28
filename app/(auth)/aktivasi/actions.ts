'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { activateParentSchema, type ActivateParentInput } from '@/lib/schemas/auth'

export interface ActivateResult {
  ok: boolean
  error?: string
}

/**
 * Aktivasi orang tua baru. Membuat auth user via Auth Admin API,
 * lalu profil + link siswa. Rollback manual bila gagal.
 * Lihat CONTEXT-7KAIH.md -> "Aktivasi & Tambah Anak".
 */
export async function activateParent(input: ActivateParentInput): Promise<ActivateResult> {
  const parsed = activateParentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Input tidak valid' }
  }
  const { code, name, email, password, relationship } = parsed.data
  const admin = createAdminClient()

  // 1) Validasi kode
  const { data: act, error: cErr } = await admin
    .from('parent_activation_codes')
    .select('id, school_id, student_id, used_at, expires_at')
    .eq('code', code.toUpperCase())
    .maybeSingle()

  if (cErr || !act) return { ok: false, error: 'Kode aktivasi tidak ditemukan' }
  if (act.used_at) return { ok: false, error: 'Kode sudah digunakan' }
  if (new Date(act.expires_at) < new Date()) return { ok: false, error: 'Kode sudah kedaluwarsa' }

  // 2) Buat auth user
  const { data: created, error: uErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (uErr) {
    if (uErr.message.toLowerCase().includes('already')) {
      return { ok: false, error: 'Email sudah terdaftar, silakan login' }
    }
    return { ok: false, error: uErr.message }
  }
  const uid = created.user.id

  // 3) Profil di public.users
  const { error: pErr } = await admin.from('users').insert({
    id: uid,
    school_id: act.school_id,
    name,
    email,
    role: 'parent',
    status: 'active',
  })
  if (pErr) {
    await admin.auth.admin.deleteUser(uid)
    return { ok: false, error: pErr.message }
  }

  // 4) Link ke siswa
  const { error: lErr } = await admin.from('student_parents').insert({
    student_id: act.student_id,
    user_id: uid,
    relationship,
  })
  if (lErr) {
    await admin.from('users').delete().eq('id', uid)
    await admin.auth.admin.deleteUser(uid)
    return { ok: false, error: lErr.message }
  }

  // 5) Tandai kode terpakai
  await admin
    .from('parent_activation_codes')
    .update({ used_at: new Date().toISOString(), used_by: uid })
    .eq('id', act.id)

  return { ok: true }
}

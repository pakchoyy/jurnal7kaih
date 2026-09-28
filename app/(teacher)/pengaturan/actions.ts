'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function simpanWhatsapp(formData: FormData) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const whatsapp = String(formData.get('whatsapp') ?? '').trim().replace(/\D/g, '')
  const { error } = await supabase
    .from('users')
    .update({ whatsapp: whatsapp || null })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/pengaturan')
  return { ok: true }
}

export async function pakaiLicenseKey(formData: FormData) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || profile.role !== 'teacher') {
    return { error: 'Akses ditolak' }
  }

  const key = String(formData.get('key') ?? '').trim().toUpperCase()
  if (!key) return { error: 'Masukkan kode lisensi' }

  const admin = createAdminClient()

  // Cek key di DB
  const { data: licenseRow, error: fetchErr } = await admin
    .from('license_keys')
    .select('id, plan, duration_months, used_at')
    .eq('key', key)
    .single()

  if (fetchErr || !licenseRow) return { error: 'Kode lisensi tidak ditemukan' }
  if (licenseRow.used_at) return { error: 'Kode lisensi sudah pernah dipakai' }

  // Hitung active_until baru
  const now = new Date()
  const activeUntil = new Date(now)
  activeUntil.setMonth(activeUntil.getMonth() + licenseRow.duration_months)

  // Update schools.plan + active_until
  const { error: updateErr } = await admin
    .from('schools')
    .update({
      plan: licenseRow.plan,
      active_until: activeUntil.toISOString(),
    })
    .eq('id', profile.school_id)

  if (updateErr) return { error: updateErr.message }

  // Tandai key sudah dipakai
  await admin
    .from('license_keys')
    .update({ used_at: now.toISOString(), used_by_school_id: profile.school_id })
    .eq('id', licenseRow.id)

  revalidatePath('/pengaturan')
  return { ok: true, plan: licenseRow.plan, activeUntil: activeUntil.toISOString() }
}

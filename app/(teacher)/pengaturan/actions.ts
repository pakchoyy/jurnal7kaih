'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeWA } from '@/lib/utils'

export async function simpanWhatsapp(formData: FormData) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis, silakan login ulang' }

  const whatsapp = normalizeWA(String(formData.get('whatsapp') ?? ''))
  if (whatsapp && !/^62\d{8,13}$/.test(whatsapp)) {
    return { error: 'Nomor WA tidak valid. Contoh: 081234567890' }
  }

  const { error } = await supabase
    .from('users')
    .update({ whatsapp: whatsapp || null })
    .eq('id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function pakaiLicenseKey(formData: FormData) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis, silakan login ulang' }

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.school_id || profile.role !== 'teacher') return { error: 'Akses ditolak' }

  const key = String(formData.get('key') ?? '').trim().toUpperCase()
  if (!/^7KAIH(-[A-Z0-9]{6}){3}$/.test(key)) return { error: 'Format kode salah. Contoh: 7KAIH-ABC123-DEF456-GHI789' }

  const admin = createAdminClient()
  const now = new Date()

  // Update bersyarat = klaim atomik; dua sekolah tidak bisa memakai kode yang sama.
  const { data: claimed } = await admin
    .from('license_keys')
    .update({ used_at: now.toISOString(), used_by_school_id: profile.school_id })
    .eq('key', key)
    .is('used_at', null)
    .select('id, plan, duration_months')
    .maybeSingle()
  if (!claimed) return { error: 'Kode tidak ditemukan atau sudah pernah dipakai' }

  const { data: school } = await admin
    .from('schools')
    .select('active_until')
    .eq('id', profile.school_id)
    .single()

  // Sisa masa aktif tidak hangus saat perpanjang.
  const current = school?.active_until ? new Date(school.active_until) : now
  const activeUntil = new Date(Math.max(current.getTime(), now.getTime()))
  activeUntil.setMonth(activeUntil.getMonth() + claimed.duration_months)

  const { error: updateErr } = await admin
    .from('schools')
    .update({ plan: claimed.plan, active_until: activeUntil.toISOString() })
    .eq('id', profile.school_id)

  if (updateErr) {
    await admin.from('license_keys').update({ used_at: null, used_by_school_id: null }).eq('id', claimed.id)
    return { error: 'Gagal mengaktifkan, coba lagi.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true, plan: claimed.plan as string, activeUntil: activeUntil.toISOString() }
}

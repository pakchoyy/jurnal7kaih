'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { THEME_COLORS } from '@/lib/theme'

const LOGO_BUCKET = 'school-logos'
const MAX_LOGO_BYTES = 1024 * 1024
const MIME_EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

async function teacherSchoolId(): Promise<string | null> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('school_id, role').eq('id', user.id).single()
  return data?.role === 'teacher' ? data.school_id : null
}

export async function simpanTema(color: string) {
  const schoolId = await teacherSchoolId()
  if (!schoolId) return { error: 'Akses ditolak' }
  if (!THEME_COLORS[color]) return { error: 'Warna tidak dikenal' }

  const { error } = await createAdminClient().from('schools').update({ theme_color: color }).eq('id', schoolId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function uploadLogo(formData: FormData) {
  const schoolId = await teacherSchoolId()
  if (!schoolId) return { error: 'Akses ditolak' }

  const file = formData.get('logo')
  if (!(file instanceof File) || file.size === 0) return { error: 'Pilih gambar logo dulu' }
  const ext = MIME_EXT[file.type]
  if (!ext) return { error: 'Format harus PNG, JPG, atau WEBP' }
  if (file.size > MAX_LOGO_BYTES) return { error: 'Ukuran logo maksimal 1 MB' }

  const admin = createAdminClient()
  const path = `${schoolId}/logo.${ext}`
  const { error: upErr } = await admin.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' })
  if (upErr) return { error: `Gagal upload: ${upErr.message}` }

  const { data } = admin.storage.from(LOGO_BUCKET).getPublicUrl(path)
  const logoUrl = `${data.publicUrl}?v=${Date.now()}`
  const { error } = await admin.from('schools').update({ logo_url: logoUrl }).eq('id', schoolId)
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { ok: true, logoUrl }
}

export async function hapusLogo() {
  const schoolId = await teacherSchoolId()
  if (!schoolId) return { error: 'Akses ditolak' }
  const admin = createAdminClient()
  await admin.storage
    .from(LOGO_BUCKET)
    .remove(Object.values(MIME_EXT).map((e) => `${schoolId}/logo.${e}`))
  const { error } = await admin.from('schools').update({ logo_url: null }).eq('id', schoolId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { ok: true }
}

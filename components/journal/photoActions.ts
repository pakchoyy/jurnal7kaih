'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MAX_PHOTOS, PHOTO_BUCKET } from '@/lib/photos'

const MAX_BYTES = 2 * 1024 * 1024
const MIME_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' }

async function ownJournal(journalId: string) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  // Hanya ortu pemilik jurnal (RLS journals_parent) yang lolos query ini.
  const { data: journal } = await supabase
    .from('journals')
    .select('id, school_id, student_id')
    .eq('id', journalId)
    .eq('created_by', user.id)
    .maybeSingle()
  return journal ? { journal, userId: user.id } : null
}

export async function uploadFoto(journalId: string, formData: FormData) {
  const owned = await ownJournal(journalId)
  if (!owned) return { error: 'Akses ditolak' }

  const file = formData.get('foto')
  if (!(file instanceof File) || file.size === 0) return { error: 'Foto kosong' }
  const ext = MIME_EXT[file.type]
  if (!ext) return { error: 'Format foto tidak didukung' }
  if (file.size > MAX_BYTES) return { error: 'Foto terlalu besar (maks 2 MB)' }

  const admin = createAdminClient()
  const { count } = await admin
    .from('journal_photos')
    .select('id', { count: 'exact', head: true })
    .eq('journal_id', journalId)
  if ((count ?? 0) >= MAX_PHOTOS) return { error: `Maksimal ${MAX_PHOTOS} foto per hari` }

  const path = `${owned.journal.school_id}/${owned.journal.student_id}/${journalId}/${crypto.randomUUID()}.${ext}`
  const { error: upErr } = await admin.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type })
  if (upErr) return { error: `Gagal unggah: ${upErr.message}` }

  const { error } = await admin
    .from('journal_photos')
    .insert({ journal_id: journalId, path, uploaded_by: owned.userId })
  if (error) {
    await admin.storage.from(PHOTO_BUCKET).remove([path])
    return { error: error.message }
  }
  revalidatePath(`/jurnal/${journalId}`)
  return { ok: true }
}

export async function hapusFoto(photoId: string) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis' }

  const admin = createAdminClient()
  const { data: photo } = await admin
    .from('journal_photos')
    .select('id, path, journal_id, uploaded_by')
    .eq('id', photoId)
    .maybeSingle()
  if (!photo || photo.uploaded_by !== user.id) return { error: 'Akses ditolak' }

  await admin.storage.from(PHOTO_BUCKET).remove([photo.path])
  await admin.from('journal_photos').delete().eq('id', photo.id)
  revalidatePath(`/jurnal/${photo.journal_id}`)
  return { ok: true }
}

'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeWA } from '@/lib/utils'

export type TeamState = { error?: string; ok?: string } | null

async function currentTeacher() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('school_id, role').eq('id', user.id).single()
  return data?.role === 'teacher' && data.school_id ? { id: user.id, schoolId: data.school_id as string } : null
}

export async function tambahAnggota(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const me = await currentTeacher()
  if (!me) return { error: 'Akses ditolak' }

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const role = String(formData.get('role') ?? '')
  const wa = normalizeWA(String(formData.get('whatsapp') ?? ''))

  if (name.length < 2) return { error: 'Nama minimal 2 karakter' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Email tidak valid' }
  if (email.endsWith('@7kaih.internal')) return { error: 'Email tidak valid' }
  if (password.length < 6) return { error: 'Password minimal 6 karakter' }
  if (role !== 'teacher' && role !== 'principal') return { error: 'Peran tidak valid' }

  const admin = createAdminClient()
  const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) {
    return { error: error.message.toLowerCase().includes('already') ? 'Email sudah terdaftar' : error.message }
  }

  const { error: pErr } = await admin.from('users').insert({
    id: created.user.id,
    school_id: me.schoolId,
    name,
    email,
    whatsapp: wa || null,
    role,
    status: 'active',
  })
  if (pErr) {
    await admin.auth.admin.deleteUser(created.user.id)
    return { error: pErr.message }
  }

  revalidatePath('/pengaturan/tim')
  return { ok: `${role === 'principal' ? 'Kepala sekolah' : 'Guru'} ${name} ditambahkan. Kirim email & password ke yang bersangkutan.` }
}

export async function ubahStatusAnggota(userId: string, active: boolean) {
  const me = await currentTeacher()
  if (!me) return { error: 'Akses ditolak' }
  if (userId === me.id) return { error: 'Tidak bisa menonaktifkan akun sendiri' }

  const admin = createAdminClient()
  const { data: target } = await admin.from('users').select('school_id, role').eq('id', userId).maybeSingle()
  if (!target || target.school_id !== me.schoolId || !['teacher', 'principal'].includes(target.role)) {
    return { error: 'Akses ditolak' }
  }

  await admin.auth.admin.updateUserById(userId, { ban_duration: active ? 'none' : '876000h' })
  await admin.from('users').update({ status: active ? 'active' : 'inactive' }).eq('id', userId)
  revalidatePath('/pengaturan/tim')
  return { ok: true }
}

'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export type FormState = { error?: string; ok?: boolean } | null

export async function gantiPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')
  if (password.length < 6) return { error: 'Password minimal 6 karakter' }
  if (password !== confirm) return { error: 'Ulangi password tidak sama' }

  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis, silakan login ulang' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: error.message.includes('different') ? 'Password baru harus beda dari yang lama' : error.message }
  }

  await supabase.from('users').update({ password_changed: true }).eq('id', user.id)
  revalidatePath('/', 'layout')
  return { ok: true }
}

'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export type ThreadState = { error?: string; sentAt?: number } | null

export async function kirimPesan(journalId: string, _prev: ThreadState, formData: FormData): Promise<ThreadState> {
  const body = String(formData.get('body') ?? '').trim()
  if (!body) return { error: 'Pesan kosong' }
  if (body.length > 1000) return { error: 'Pesan maksimal 1000 karakter' }

  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis, silakan login ulang' }

  // RLS hanya mengizinkan jurnal yang boleh diakses pengirim.
  const { error } = await supabase.from('journal_messages').insert({ journal_id: journalId, sender_id: user.id, body })
  if (error) return { error: 'Pesan gagal dikirim' }

  revalidatePath('/jurnal/' + journalId)
  revalidatePath('/siswa', 'layout')
  return { sentAt: Date.now() }
}

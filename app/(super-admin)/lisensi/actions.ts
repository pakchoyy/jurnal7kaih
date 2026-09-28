'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { generateActivationCode } from '@/lib/utils'

function generateKey(): string {
  return `7KAIH-${generateActivationCode(6)}-${generateActivationCode(6)}-${generateActivationCode(6)}`
}

const DURATION: Record<string, number> = {
  semester: 6,
  annual: 12,
  lifetime: 9999,
}

export async function buatLicenseKey(formData: FormData) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'super_admin') return { error: 'Akses ditolak' }

  const plan = String(formData.get('plan') ?? '')
  const qty = Math.min(50, Math.max(1, Number(formData.get('qty') ?? 1)))
  if (!DURATION[plan]) return { error: 'Plan tidak valid' }

  const admin = createAdminClient()
  const keys = Array.from({ length: qty }, () => ({
    key: generateKey(),
    plan,
    duration_months: DURATION[plan],
    created_by: user.id,
  }))

  const { error } = await admin.from('license_keys').insert(keys)
  if (error) return { error: error.message }

  revalidatePath('/lisensi')
  return { ok: true, keys: keys.map((k) => k.key) }
}

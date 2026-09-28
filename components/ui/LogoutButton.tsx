'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function LogoutButton({ compact }: { compact?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  return (
    <button
      type="button"
      disabled={loading}
      className={cn(
        'rounded-btn border-[1.5px] border-red-200 bg-red-50 font-display font-extrabold text-red-500 transition active:scale-[.98] disabled:opacity-50',
        compact ? 'px-3 py-1.5 text-[11px]' : 'w-full py-3',
      )}
      onClick={async () => {
        setLoading(true)
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
      }}
    >
      {loading ? 'Keluar…' : 'Keluar'}
    </button>
  )
}

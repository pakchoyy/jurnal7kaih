'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  return (
    <button
      type="button"
      disabled={loading}
      className="w-full rounded-btn border border-red-200 bg-red-50 py-3 font-semibold text-red-500 disabled:opacity-50"
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

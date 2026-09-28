'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { hapusFoto } from './photoActions'

export function DeletePhotoButton({ photoId }: { photoId: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Hapus foto"
      onClick={() => {
        if (!confirm('Hapus foto ini?')) return
        start(async () => {
          await hapusFoto(photoId)
          router.refresh()
        })
      }}
      className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-sm text-white"
    >
      {pending ? '…' : '✕'}
    </button>
  )
}

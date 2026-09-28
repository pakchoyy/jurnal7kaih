'use client'

import { useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { kirimPesan, type ThreadState } from './threadActions'

function Send() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-btn bg-brand-blue px-4 text-base font-bold text-white disabled:opacity-50"
    >
      {pending ? '…' : 'Kirim'}
    </button>
  )
}

export function ThreadForm({ journalId, placeholder }: { journalId: string; placeholder: string }) {
  const [state, action] = useFormState<ThreadState, FormData>(kirimPesan.bind(null, journalId), null)
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.sentAt) ref.current?.reset()
  }, [state?.sentAt])

  return (
    <form ref={ref} action={action} className="mt-3">
      <div className="flex gap-2">
        <textarea
          name="body"
          required
          maxLength={1000}
          rows={2}
          placeholder={placeholder}
          aria-label="Tulis pesan"
          className="min-w-0 flex-1 resize-none rounded-btn border-[1.5px] border-line px-3 py-2.5 text-base outline-none focus:border-brand-blue"
        />
        <Send />
      </div>
      {state?.error && <p className="mt-1 text-sm font-semibold text-red-600">{state.error}</p>}
    </form>
  )
}

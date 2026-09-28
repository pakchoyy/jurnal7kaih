import type { SupabaseClient } from '@supabase/supabase-js'
import { ThreadForm } from './ThreadForm'

const time = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Jakarta',
})

export async function JournalThread({
  supabase,
  journalId,
  userId,
  title,
  placeholder,
}: {
  supabase: SupabaseClient
  journalId: string
  userId: string
  title: string
  placeholder: string
}) {
  const { data: messages } = await supabase
    .from('journal_messages')
    .select('id, body, created_at, sender_id, users(name, role)')
    .eq('journal_id', journalId)
    .order('created_at')

  return (
    <section className="mt-5 rounded-card bg-white p-4 shadow-soft">
      <h2 className="mb-3 font-display text-base font-extrabold text-ink">💬 {title}</h2>
      {(messages ?? []).length === 0 ? (
        <p className="text-sm text-ink-3">Belum ada pesan.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {(messages ?? []).map((m) => {
            const mine = m.sender_id === userId
            const sender = m.users as unknown as { name: string; role: string } | null
            return (
              <li key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                    mine ? 'rounded-br-md bg-brand-blue text-white' : 'rounded-bl-md bg-bg text-ink'
                  }`}
                >
                  {!mine && (
                    <p className="mb-0.5 text-xs font-bold opacity-80">
                      {sender?.role === 'parent' ? 'Orang tua' : sender?.name ?? 'Guru'}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words text-base">{m.body}</p>
                  <p className={`mt-1 text-right text-[11px] ${mine ? 'text-white/75' : 'text-ink-3'}`}>
                    {time.format(new Date(m.created_at))}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <ThreadForm journalId={journalId} placeholder={placeholder} />
    </section>
  )
}

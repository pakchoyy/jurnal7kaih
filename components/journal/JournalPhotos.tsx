import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { PHOTO_BUCKET } from '@/lib/photos'
import { DeletePhotoButton } from './DeletePhotoButton'

export async function JournalPhotos({
  supabase,
  journalId,
  canDeleteUserId,
}: {
  supabase: SupabaseClient
  journalId: string
  canDeleteUserId?: string
}) {
  // RLS memfilter foto hanya untuk jurnal yang boleh dilihat user ini.
  const { data: photos } = await supabase
    .from('journal_photos')
    .select('id, path, uploaded_by')
    .eq('journal_id', journalId)
    .order('created_at')
  if (!photos?.length) return null

  const { data: signed } = await createAdminClient()
    .storage.from(PHOTO_BUCKET)
    .createSignedUrls(
      photos.map((p) => p.path),
      60 * 60,
    )

  return (
    <section className="mt-5">
      <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink-2">📷 Foto Kegiatan</h2>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => {
          const url = signed?.[i]?.signedUrl
          if (!url) return null
          return (
            <div key={p.id} className="relative">
              <a href={url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto kegiatan ${i + 1}`} className="aspect-square w-full rounded-btn object-cover" />
              </a>
              {canDeleteUserId === p.uploaded_by && <DeletePhotoButton photoId={p.id} />}
            </div>
          )
        })}
      </div>
    </section>
  )
}

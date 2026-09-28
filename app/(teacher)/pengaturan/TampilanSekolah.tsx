'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { THEME_COLORS } from '@/lib/theme'
import { hapusLogo, simpanTema, uploadLogo } from './tampilanActions'

export default function TampilanSekolah({
  schoolName,
  logoUrl,
  themeColor,
}: {
  schoolName: string
  logoUrl: string | null
  themeColor: string
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [logo, setLogo] = useState(logoUrl)
  const [color, setColor] = useState(themeColor)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 1024 * 1024) return setMsg({ ok: false, text: 'Ukuran logo maksimal 1 MB' })
    setBusy(true)
    setMsg(null)
    const fd = new FormData()
    fd.set('logo', file)
    const res = await uploadLogo(fd)
    setBusy(false)
    if (res.error) return setMsg({ ok: false, text: res.error })
    setLogo(res.logoUrl ?? null)
    setMsg({ ok: true, text: 'Logo tersimpan' })
    router.refresh()
  }

  async function removeLogo() {
    setBusy(true)
    const res = await hapusLogo()
    setBusy(false)
    if (res.error) return setMsg({ ok: false, text: res.error })
    setLogo(null)
    router.refresh()
  }

  async function pickColor(key: string) {
    setColor(key)
    setMsg(null)
    const res = await simpanTema(key)
    if (res.error) return setMsg({ ok: false, text: res.error })
    router.refresh()
  }

  return (
    <div className="mb-4 rounded-card bg-white p-5 shadow-soft">
      <p className="mb-1 font-display text-base font-extrabold text-ink">Tampilan Sekolah</p>
      <p className="mb-4 text-sm text-ink-3">Logo & warna tampil di aplikasi guru dan orang tua, juga di rapor.</p>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-bg">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={`Logo ${schoolName}`} className="h-full w-full object-contain" />
          ) : (
            <span className="text-3xl">🏫</span>
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="rounded-btn bg-brand-blue px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? 'Mengunggah…' : logo ? 'Ganti Logo' : 'Unggah Logo'}
          </button>
          {logo && (
            <button type="button" disabled={busy} onClick={removeLogo} className="text-sm font-semibold text-red-600 underline">
              Hapus logo
            </button>
          )}
          <span className="text-xs text-ink-3">PNG/JPG/WEBP, maks 1 MB</span>
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} />
      </div>

      <p className="mb-2 text-sm font-bold text-ink-2">Warna tema</p>
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(THEME_COLORS).map(([key, c]) => (
          <button
            key={key}
            type="button"
            onClick={() => pickColor(key)}
            aria-pressed={color === key}
            className={`flex flex-col items-center gap-1 rounded-btn border-2 p-2 ${color === key ? 'border-ink' : 'border-transparent'}`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: c.hex }}>
              {color === key ? '✓' : ''}
            </span>
            <span className="text-xs text-ink-2">{c.name}</span>
          </button>
        ))}
      </div>

      {msg && (
        <p className={`mt-3 text-sm font-semibold ${msg.ok ? 'text-emerald-600' : 'text-red-600'}`}>{msg.text}</p>
      )}
    </div>
  )
}

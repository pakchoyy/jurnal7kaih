'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { usePwaInstall } from './usePwaInstall'

// Muncul lagi setiap kali browser dibuka sampai aplikasi terpasang,
// tapi cukup sekali per sesi agar tidak mengganggu.
const DISMISS_KEY = 'pwa-install-dismissed'
const NO_NAV_PATHS = ['/login', '/daftar-trial', '/rapor', '/kepsek']

function dismissedThisSession() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {})
    }
  }, [])
  return null
}

export function InstallBanner() {
  const pathname = usePathname()
  const { installed, canPrompt, ios, install } = usePwaInstall()
  const [hidden, setHidden] = useState(true)

  useEffect(() => setHidden(dismissedThisSession()), [])

  if (installed || hidden || (!canPrompt && !ios)) return null

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {}
    setHidden(true)
  }

  const aboveNav = !NO_NAV_PATHS.some((p) => pathname.startsWith(p)) && pathname !== '/'

  return (
    <div
      className={`fixed inset-x-0 z-50 mx-auto max-w-lg px-3 ${aboveNav ? 'bottom-20' : 'bottom-3'}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="install-in flex items-center gap-3 rounded-card bg-brand-dark p-3 text-white shadow-lift">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="float-y h-11 w-11 flex-shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Pasang SiHebat</p>
          <p className="text-xs text-white/75">
            {ios ? 'Ketuk tombol Bagikan ⎋ lalu “Tambah ke Layar Utama”' : 'Gratis & ringan. Buka langsung dari layar HP seperti aplikasi.'}
          </p>
        </div>
        {!ios && (
          <button
            type="button"
            onClick={install}
            className="pulse-ring rounded-btn bg-brand-yellow px-3.5 py-2 text-sm font-bold text-brand-dark"
          >
            Pasang
          </button>
        )}
        <button type="button" onClick={dismiss} aria-label="Nanti saja" className="px-1 text-lg text-white/70">
          ✕
        </button>
      </div>
    </div>
  )
}

export function InstallCard() {
  const { installed, canPrompt, ios, install } = usePwaInstall()
  if (installed) return null

  return (
    <div className="flex items-center gap-3 rounded-card bg-white p-4 shadow-soft">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-xl" />
      <div className="flex-1">
        <p className="text-base font-bold text-ink">Pasang Aplikasi</p>
        <p className="text-sm text-ink-3">
          {canPrompt
            ? 'Ikon muncul di layar HP, buka tanpa browser.'
            : ios
              ? 'Safari: ketuk Bagikan ⎋ → “Tambah ke Layar Utama”.'
              : 'Chrome: menu ⋮ → “Instal aplikasi” / “Tambahkan ke layar utama”.'}
        </p>
      </div>
      {canPrompt && (
        <button
          type="button"
          onClick={install}
          className="rounded-btn bg-brand-blue px-4 py-2.5 text-sm font-bold text-white"
        >
          Pasang
        </button>
      )}
    </div>
  )
}

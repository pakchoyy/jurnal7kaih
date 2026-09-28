'use client'

import { useEffect, useState } from 'react'
import { hapusLangganan, simpanLangganan } from './pushActions'

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function keyToBytes(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

type Status = 'loading' | 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on'

export function PushToggle({ hideWhenOn = false }: { hideWhenOn?: boolean }) {
  const [status, setStatus] = useState<Status>('loading')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
      const standalone = window.matchMedia('(display-mode: standalone)').matches
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID) {
        return setStatus(ios && !standalone ? 'ios-install' : 'unsupported')
      }
      if (Notification.permission === 'denied') return setStatus('denied')
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      setStatus(sub ? 'on' : 'off')
    })()
  }, [])

  async function enable() {
    setBusy(true)
    setError(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'off')
        return
      }
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register('/sw.js'))
      await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(VAPID) })
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      const res = await simpanLangganan(json)
      if (res.error) throw new Error(res.error)
      setStatus('on')
    } catch (e) {
      setError('Gagal mengaktifkan pengingat. Coba lagi.')
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true)
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    if (sub) {
      await hapusLangganan(sub.endpoint)
      await sub.unsubscribe()
    }
    setStatus('off')
    setBusy(false)
  }

  if (status === 'loading' || status === 'unsupported') return null
  if (hideWhenOn && status !== 'off') return null

  return (
    <div className="flex items-center gap-3 rounded-card bg-white p-4 shadow-soft">
      <span className="text-2xl">🔔</span>
      <div className="flex-1">
        <p className="text-base font-bold text-ink">Pengingat Jam 19.00</p>
        <p className="text-sm text-ink-3">
          {status === 'on' && 'Aktif. HP akan diingatkan bila jurnal belum diisi.'}
          {status === 'off' && 'Dapat notifikasi bila jurnal hari ini belum diisi.'}
          {status === 'denied' && 'Notifikasi diblokir. Izinkan di pengaturan browser.'}
          {status === 'ios-install' && 'iPhone: pasang aplikasi ke layar utama dulu untuk mengaktifkan.'}
        </p>
        {error && <p className="mt-1 text-sm font-semibold text-red-600">{error}</p>}
      </div>
      {(status === 'on' || status === 'off') && (
        <button
          type="button"
          disabled={busy}
          onClick={status === 'on' ? disable : enable}
          className={`rounded-btn px-4 py-2.5 text-sm font-bold disabled:opacity-50 ${
            status === 'on' ? 'bg-bg text-ink-2' : 'bg-brand-blue text-white'
          }`}
        >
          {busy ? '…' : status === 'on' ? 'Matikan' : 'Aktifkan'}
        </button>
      )}
    </div>
  )
}

import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'SiHebat — Jurnal 7 Kebiasaan Anak Indonesia Hebat',
    short_name: 'SiHebat',
    description: 'Catat 7 Kebiasaan Anak Indonesia Hebat setiap hari, untuk orang tua dan guru.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#EEF2FA',
    theme_color: '#1A5FBA',
    lang: 'id',
    categories: ['education', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Isi Jurnal Hari Ini', short_name: 'Isi Jurnal', url: '/jurnal/isi' },
      { name: 'Dashboard Guru', short_name: 'Dashboard', url: '/teacher-dashboard' },
    ],
  }
}

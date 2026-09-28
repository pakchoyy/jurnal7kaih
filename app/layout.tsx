import type { Metadata, Viewport } from 'next'
import { Nunito, Inter } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Jurnal 7 Kebiasaan Anak Indonesia Hebat',
  description:
    'Aplikasi pencatatan 7 Kebiasaan Anak Indonesia Hebat (7Kaih) untuk orang tua, guru, dan sekolah.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1A5FBA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${nunito.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  )
}

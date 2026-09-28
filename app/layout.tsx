import type { Metadata, Viewport } from 'next'
import { Nunito, Inter } from 'next/font/google'
import './globals.css'
import { InstallBanner, ServiceWorkerRegister } from '@/components/pwa/InstallPrompt'

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
  applicationName: 'Jurnal 7KAIH',
  appleWebApp: { capable: true, title: 'Jurnal 7KAIH', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: '/icons/apple-touch-icon.png',
  },
  description:
    'Aplikasi pencatatan 7 Kebiasaan Anak Indonesia Hebat (7Kaih) untuk orang tua, guru, dan sekolah.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1A5FBA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${nunito.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          // Pasang sebelum render agar tidak berkedip saat mode huruf besar aktif.
          dangerouslySetInnerHTML={{
            __html: "try{if(localStorage.getItem('huruf-besar')==='1')document.documentElement.classList.add('big-text')}catch(e){}",
          }}
        />
      </head>
      <body>
        {children}
        <ServiceWorkerRegister />
        <InstallBanner />
      </body>
    </html>
  )
}

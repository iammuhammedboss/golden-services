import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'
import { AuthProvider } from '@/components/providers/auth-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Golden Services Oman - Professional Cleaning, Pest Control & Manpower Solutions',
  description: 'Leading provider of cleaning, pest control, and manpower services in Oman. Contact our sales representatives at +968 96785802, +968 92314145, +968 96785806 for expert assistance.',
  keywords: ['cleaning services Oman', 'pest control Salalah', 'manpower services', 'professional cleaning', 'Oman services', 'Golden Services'],
  authors: [{ name: 'Golden Services' }],
  creator: 'Golden Services',
  publisher: 'Golden Services',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://goldenservicesom.com',
    title: 'Golden Services Oman - Professional Cleaning, Pest Control & Manpower Solutions',
    description: 'Leading provider of cleaning, pest control, and manpower services in Oman.',
    siteName: 'Golden Services',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
  params: {
    locale: string
  }
}

export default function RootLayout({
  children,
  params: { locale },
}: RootLayoutProps) {
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MedlyGo - Hospital Appointment Booking',
  description: 'Book non-emergency hospital appointments at public hospitals across Ghana. Skip the queue with MedlyGo.',
  keywords: ['hospital', 'appointment', 'booking', 'Ghana', 'healthcare', 'medical'],
  authors: [{ name: 'MedlyGo' }],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'MedlyGo - Hospital Appointment Booking',
    description: 'Book non-emergency hospital appointments at public hospitals across Ghana.',
    url: 'https://medlygo.com',
    siteName: 'MedlyGo',
    locale: 'en_GH',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

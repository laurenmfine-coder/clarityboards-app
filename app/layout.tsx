import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ToastProvider'
import { NextIntlClientProvider } from 'next-intl'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Clarityboards — Your life, clearly organized.',
  description: 'One place for every deadline, checklist, RSVP, and next action across your whole life.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Clarityboards',
  },
  icons: {
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1A2B3C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'it', 'pt', 'pt-BR', 'de']

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let messages = {}
  let locale = 'en'

  try {
    const headersList = headers()
    const xLocale = headersList.get('x-locale')
    if (xLocale && SUPPORTED_LOCALES.includes(xLocale)) locale = xLocale
    messages = (await import(`../messages/${locale}.json`)).default
  } catch {
    try {
      messages = (await import('../messages/en.json')).default
    } catch {}
  }

  return (
    <html lang={locale}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Clarityboards" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

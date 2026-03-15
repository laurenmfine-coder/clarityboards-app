import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cozi Alternative — Clarityboards',
  description: 'Cozi locked years of your family history behind a paywall. Clarityboards gives you a full calendar, shared boards, and complete data export — always free at any tier.',
  openGraph: {
    title: 'The Cozi Alternative That Keeps Your Data Free',
    description: 'Cozi locked years of your family history behind a paywall. Clarityboards gives you a full shared calendar and data export — forever.',
    url: 'https://clarityboards.app/cozi-alternative',
    siteName: 'Clarityboards',
    images: [{ url: 'https://clarityboards.app/api/og-image?page=cozi-alternative', width: 1200, height: 630, alt: 'Clarityboards — The Cozi Alternative' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Cozi Alternative That Keeps Your Data Free',
    description: 'Cozi locked years of your family history behind a paywall. Clarityboards is different.',
    images: ['https://clarityboards.app/api/og-image?page=cozi-alternative'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
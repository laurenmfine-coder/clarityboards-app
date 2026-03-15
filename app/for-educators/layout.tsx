import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For Educators — Clarityboards',
  description: 'Plan lessons, track tasks, coordinate events, and collaborate with colleagues in one organized workspace. Clarityboards is built for how educators actually work.',
  openGraph: {
    title: 'The Organizer Built for Educators',
    description: 'Lesson plans, event coordination, shared task boards, and calendars — Clarityboards helps educators stay organized across every role they play.',
    url: 'https://clarityboards.app/for-educators',
    siteName: 'Clarityboards',
    images: [{ url: 'https://clarityboards.app/api/og-image?page=for-educators', width: 1200, height: 630, alt: 'Clarityboards for Educators' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Organizer Built for Educators',
    description: 'Lesson plans, events, shared task boards — Clarityboards keeps every part of your work organized.',
    images: ['https://clarityboards.app/api/og-image?page=for-educators'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
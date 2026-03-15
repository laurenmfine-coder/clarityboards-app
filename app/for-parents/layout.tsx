import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For Parents — Clarityboards',
  description: 'Manage school pickups, meal planning, sports schedules, and family checklists in one shared place. Clarityboards keeps your whole household in sync.',
  openGraph: {
    title: 'The Family Organizer Built for Busy Parents',
    description: 'School schedules, meal plans, checklists, and shared calendars — all in one calm, clutter-free space for your whole family.',
    url: 'https://clarityboards.app/for-parents',
    siteName: 'Clarityboards',
    images: [{ url: 'https://clarityboards.app/api/og-image?page=for-parents', width: 1200, height: 630, alt: 'Clarityboards for Parents' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Family Organizer Built for Busy Parents',
    description: 'School schedules, meal plans, shared calendars — all in one place for your whole family.',
    images: ['https://clarityboards.app/api/og-image?page=for-parents'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
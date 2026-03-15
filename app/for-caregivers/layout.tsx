import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For Caregivers — Clarityboards',
  description: 'Coordinate care schedules, appointments, medication reminders, and shared task lists across your care team. Clarityboards keeps everyone on the same page.',
  openGraph: {
    title: 'Shared Care Coordination, Simplified',
    description: 'Appointments, medication lists, shared task boards, and care calendars — Clarityboards helps caregiving teams stay organized without the chaos.',
    url: 'https://clarityboards.app/for-caregivers',
    siteName: 'Clarityboards',
    images: [{ url: 'https://clarityboards.app/api/og-image?page=for-caregivers', width: 1200, height: 630, alt: 'Clarityboards for Caregivers' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shared Care Coordination, Simplified',
    description: 'Appointments, medication lists, and care calendars — Clarityboards keeps every caregiver in sync.',
    images: ['https://clarityboards.app/api/og-image?page=for-caregivers'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For Freelancers - Clarityboards',
  description: 'Track client projects, deadlines, invoices, and personal tasks in one clean workspace. Clarityboards is the quiet, focused organizer for independent workers.',
  openGraph: {
    title: 'The Freelancer Organizer - Clean, Focused, Free',
    description: 'Client deadlines, project checklists, personal tasks - all in one organized space with no subscriptions required to get started.',
    url: 'https://clarityboards.app/for-freelancers',
    siteName: 'Clarityboards',
    images: [{ url: 'https://clarityboards.app/api/og-image?page=for-freelancers', width: 1200, height: 630, alt: 'Clarityboards for Freelancers' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Freelancer Organizer - Clean, Focused, Free',
    description: 'Client deadlines, project checklists, personal tasks - organized in one quiet space.',
    images: ['https://clarityboards.app/api/og-image?page=for-freelancers'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
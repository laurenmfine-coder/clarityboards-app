import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For Students — Clarityboards',
  description: 'Track assignments, deadlines, exams, and study tasks across all your classes in one organized board. Clarityboards is the student planner that actually works.',
  openGraph: {
    title: 'The Student Planner That Actually Keeps Up With You',
    description: 'Assignments, exams, deadlines, and study checklists — all in one board that you can share with study partners or keep to yourself.',
    url: 'https://clarityboards.app/for-students',
    siteName: 'Clarityboards',
    images: [{ url: 'https://clarityboards.app/api/og-image?page=for-students', width: 1200, height: 630, alt: 'Clarityboards for Students' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Student Planner That Actually Keeps Up With You',
    description: 'Assignments, exams, deadlines — all in one organized board. Free to start.',
    images: ['https://clarityboards.app/api/og-image?page=for-students'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
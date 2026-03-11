import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Clarityboards — Your life, clearly organized.',
  description: 'One place for every deadline, checklist, RSVP, and next action across your whole life.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  // All supported locales
  locales: ['en', 'es', 'fr', 'it', 'pt', 'pt-BR', 'de'],

  // Default locale (used when no match found)
  defaultLocale: 'en',

  // Auto-detect from browser's Accept-Language header
  localeDetection: true,
})

export const config = {
  // Match all paths except API routes, Next.js internals, and static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}

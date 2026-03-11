import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['en', 'es', 'fr', 'it', 'pt', 'pt-BR', 'de'],
  defaultLocale: 'en',
  localeDetection: true,
  localePrefix: 'never',
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}

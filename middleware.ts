import { NextRequest, NextResponse } from 'next/server'

const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'it', 'pt', 'pt-BR', 'de']
const DEFAULT_LOCALE = 'en'

function detectLocale(req: NextRequest): string {
  // Check cookie first (manual override)
  const cookieLocale = req.cookies.get('locale')?.value
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) return cookieLocale

  // Fall back to Accept-Language header
  const acceptLang = req.headers.get('accept-language') ?? ''
  for (const part of acceptLang.split(',')) {
    const tag = part.split(';')[0].trim()
    if (SUPPORTED_LOCALES.includes(tag)) return tag
    const short = tag.split('-')[0]
    const match = SUPPORTED_LOCALES.find(l => l === short || l.startsWith(short + '-'))
    if (match) return match
  }

  return DEFAULT_LOCALE
}

export function middleware(req: NextRequest) {
  const locale = detectLocale(req)
  const res = NextResponse.next()
  res.headers.set('x-locale', locale)
  return res
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}

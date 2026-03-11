import { getRequestConfig } from 'next-intl/server'
import { headers } from 'next/headers'

const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'it', 'pt', 'pt-BR', 'de']

export default getRequestConfig(async () => {
  let locale = 'en'
  try {
    const headersList = headers()
    const xLocale = headersList.get('x-locale')
    if (xLocale && SUPPORTED_LOCALES.includes(xLocale)) locale = xLocale
  } catch {
    // build time — use default
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})

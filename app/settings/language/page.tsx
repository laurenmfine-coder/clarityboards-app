'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'

const LANGUAGES = [
  { code: 'en',    label: 'English',    flag: '🇺🇸' },
  { code: 'es',    label: 'Español',    flag: '🇪🇸' },
  { code: 'fr',    label: 'Français',   flag: '🇫🇷' },
  { code: 'it',    label: 'Italiano',   flag: '🇮🇹' },
  { code: 'pt',    label: 'Português',  flag: '🇵🇹' },
  { code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'de',    label: 'Deutsch',    flag: '🇩🇪' },
]

export default function LanguagePage() {
  const router = useRouter()
  const [current, setCurrent] = useState('en')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('locale='))
    if (cookie) setCurrent(cookie.split('=')[1].trim())
  }, [])

  const handleSelect = (code: string) => {
    // Set cookie for 1 year
    document.cookie = `locale=${code};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
    setCurrent(code)
    setSaved(true)
    setTimeout(() => {
      // Hard reload so server receives the new cookie and serves correct language
      window.location.replace('/dashboard')
    }, 600)
  }

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: '100vh', background: '#FAFAF8' }}>
      <nav style={{ background: '#1A1714', borderBottom: '0.5px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 300, padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 12L6 8l4-4"/></svg>
            Dashboard
          </button>
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)' }}/>
          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'white', fontSize: 19, fontWeight: 400, letterSpacing: '0.01em' }}>
            Language
          </span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-10">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm text-[#5A7A94] hover:text-[#1A2B3C] mb-8 transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#1A2B3C]">Language</h1>
          <p className="text-sm text-[#5A7A94] mt-1">Choose your preferred language</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#EBF3FB] overflow-hidden">
          {LANGUAGES.map((lang, i) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#F8FAFE] transition-colors text-left"
              style={{ borderBottom: i < LANGUAGES.length - 1 ? '1px solid #F0ECE4' : 'none' }}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="flex-1 font-medium text-[#1A2B3C]">{lang.label}</span>
              {current === lang.code && (
                <Check size={18} className="text-[#2874A6]" />
              )}
            </button>
          ))}
        </div>

        {saved && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 text-center">
            ✓ Language updated — redirecting…
          </div>
        )}

        <p className="text-xs text-[#9B8E7E] text-center mt-6">
          Your browser language is used by default. This setting overrides it.
        </p>
      </div>
    </div>
  )
}

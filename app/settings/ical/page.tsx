'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BOARDS } from '@/lib/boards'
import { Calendar, Copy, Check, Download, ExternalLink, Smartphone, Monitor } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function ICalSettingsPage() {
  const t = useTranslations('settingsIcal')
  const [userId, setUserId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://clarityboards-app.vercel.app'

  const allBoardsUrl = userId ? `${baseUrl}/api/ical?uid=${userId}` : ''

  const boardUrls = BOARDS.map(b => ({
    ...b,
    url: userId ? `${baseUrl}/api/ical?uid=${userId}&board=${b.id}` : '',
  }))

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4E6F1] text-[#5A7A94] text-xs font-medium hover:bg-[#EBF3FB] transition-colors flex-shrink-0"
    >
      {copied === id ? <><Check size={12} className="text-green-500" /> {t('copied')}</> : <><Copy size={12} /> {t('copyLink')}</>}
    </button>
  )

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
            Calendar Export
          </span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#1B4F8A] flex items-center justify-center">
            <Calendar size={20} color="white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A2B3C]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Calendar Export (iCal)
            </h1>
            <p className="text-sm text-[#5A7A94]">Subscribe in Apple Calendar, Google Calendar, or Outlook</p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-[#EBF3FB] p-5 mb-5">
          <h2 className="font-semibold text-[#1A2B3C] mb-3 text-sm uppercase tracking-wide">How it works</h2>
          <div className="space-y-3">
            {[
              { icon: '📅', text: 'Items with dates appear as all-day events in your calendar app' },
              { icon: '🔄', text: 'Updates automatically — add an item in Clarityboards, it appears in your calendar' },
              { icon: '📋', text: 'Notes, status, and checklist progress are included in event descriptions' },
              { icon: '🔒', text: 'Your feed URL is private — do not share it publicly' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span>{item.icon}</span>
                <span className="text-[#5A7A94]">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* All boards feed */}
        <div className="bg-white rounded-2xl border border-[#EBF3FB] p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold text-[#1A2B3C]">All Boards Feed</div>
              <div className="text-xs text-[#5A7A94]">Every item with a date, across all boards</div>
            </div>
            <CopyButton text={allBoardsUrl} id="all" />
          </div>
          <div className="background: "#FAFAF8" rounded-lg px-3 py-2 text-xs text-[#5A7A94] font-mono break-all">
            {allBoardsUrl || 'Loading…'}
          </div>
          <a
            href={allBoardsUrl}
            download="clarityboards.ics"
            className="mt-3 flex items-center gap-1.5 text-xs text-[#1B4F8A] hover:underline"
          >
            <Download size={12} /> Download .ics file instead
          </a>
        </div>

        {/* Per-board feeds */}
        <div className="bg-white rounded-2xl border border-[#EBF3FB] p-5 mb-5">
          <div className="font-semibold text-[#1A2B3C] mb-4">Individual Board Feeds</div>
          <div className="space-y-3">
            {boardUrls.map(b => (
              <div key={b.id} className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0 text-xs"
                  style={{ background: b.color, fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {b.letter}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#1A2B3C]">{b.label}</div>
                  <div className="text-xs text-[#5A7A94] font-mono truncate">{b.url}</div>
                </div>
                <CopyButton text={b.url} id={b.id} />
              </div>
            ))}
          </div>
        </div>

        {/* Instructions by platform */}
        <div className="bg-white rounded-2xl border border-[#EBF3FB] p-5">
          <div className="font-semibold text-[#1A2B3C] mb-4">How to subscribe</div>
          <div className="space-y-5">

            {/* iPhone */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Smartphone size={14} className="text-[#5A7A94]" />
                <span className="text-sm font-semibold text-[#1A2B3C]">iPhone / iPad (Apple Calendar)</span>
              </div>
              <ol className="text-sm text-[#5A7A94] space-y-1 list-decimal list-inside">
                <li>Copy the feed URL above</li>
                <li>Open <strong>Settings</strong> → <strong>Calendar</strong> → <strong>Accounts</strong></li>
                <li>Tap <strong>Add Account</strong> → <strong>Other</strong> → <strong>Add Subscribed Calendar</strong></li>
                <li>Paste the URL and tap <strong>Next</strong></li>
                <li>Tap <strong>Save</strong> — done!</li>
              </ol>
            </div>

            {/* Google Calendar */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Monitor size={14} className="text-[#5A7A94]" />
                <span className="text-sm font-semibold text-[#1A2B3C]">Google Calendar</span>
              </div>
              <ol className="text-sm text-[#5A7A94] space-y-1 list-decimal list-inside">
                <li>Copy the feed URL above</li>
                <li>Open <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-[#1B4F8A] hover:underline inline-flex items-center gap-0.5">calendar.google.com <ExternalLink size={10} /></a></li>
                <li>Click <strong>+</strong> next to "Other calendars" → <strong>From URL</strong></li>
                <li>Paste the URL and click <strong>Add calendar</strong></li>
              </ol>
            </div>

            {/* Outlook */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Monitor size={14} className="text-[#5A7A94]" />
                <span className="text-sm font-semibold text-[#1A2B3C]">Outlook / Microsoft 365</span>
              </div>
              <ol className="text-sm text-[#5A7A94] space-y-1 list-decimal list-inside">
                <li>Copy the feed URL above</li>
                <li>Open Outlook → <strong>Calendar</strong> view</li>
                <li>Click <strong>Add calendar</strong> → <strong>Subscribe from web</strong></li>
                <li>Paste the URL and click <strong>Import</strong></li>
              </ol>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

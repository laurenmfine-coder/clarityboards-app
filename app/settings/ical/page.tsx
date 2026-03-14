'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BOARDS } from '@/lib/boards'
import { Calendar, Copy, Check, Download, ExternalLink, Smartphone, Monitor } from 'lucide-react'
import { useTranslations } from 'next-intl'

const INK  = '#1A1714'
const BG   = '#FAFAF8'
const SANS = "'DM Sans', system-ui, sans-serif"
const SERIF = "'Cormorant Garamond', Georgia, serif"

export default function ICalSettingsPage() {
  const t = useTranslations('settingsIcal')
  const router = useRouter()
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
    <button onClick={() => copyToClipboard(text, id)}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 4, border: '0.5px solid #E8E4DF', color: '#5C5650', fontSize: 12, fontWeight: 500, background: 'white', cursor: 'pointer', flexShrink: 0, fontFamily: SANS }}>
      {copied === id
        ? <><Check size={12} style={{ color: '#3D6B52' }} /> {t('copied')}</>
        : <><Copy size={12} /> {t('copyLink')}</>}
    </button>
  )

  const card: React.CSSProperties = { background: 'white', borderRadius: 8, border: '0.5px solid #E8E4DF', padding: '20px 22px', marginBottom: 12 }
  const sectionLabel: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: '#9C968F', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontFamily: SANS }
  const bodyText: React.CSSProperties = { fontSize: 13, color: '#5C5650', fontWeight: 300, lineHeight: 1.6 }

  return (
    <div style={{ fontFamily: SANS, minHeight: '100vh', background: BG }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap'); * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }`}</style>

      <nav style={{ background: INK, borderBottom: '0.5px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 300, padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 12L6 8l4-4"/></svg>
            Dashboard
          </button>
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)' }}/>
          <span style={{ fontFamily: SERIF, color: 'white', fontSize: 19, fontWeight: 400, letterSpacing: '0.01em' }}>
            Calendar Export
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, paddingBottom: 20, borderBottom: '0.5px solid #E8E4DF' }}>
          <div style={{ width: 44, height: 44, borderRadius: 6, background: '#F5F2EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar size={20} color="#5C5650" strokeWidth={1.5} />
          </div>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 26, color: INK, fontWeight: 400, letterSpacing: '0.01em', lineHeight: 1.1 }}>Calendar Export</div>
            <div style={{ fontSize: 12, color: '#9C968F', fontWeight: 300, marginTop: 3 }}>Subscribe in Apple Calendar, Google Calendar, or Outlook</div>
          </div>
        </div>

        {/* How it works */}
        <div style={card}>
          <div style={sectionLabel}>How it works</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '📅', text: 'Items with dates appear as all-day events in your calendar app' },
              { icon: '🔄', text: 'Updates automatically — add an item in Clarityboards, it appears in your calendar' },
              { icon: '📋', text: 'Notes, status, and checklist progress are included in event descriptions' },
              { icon: '🔒', text: 'Your feed URL is private — do not share it publicly' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span style={bodyText}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* All boards feed */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: INK }}>All Boards Feed</div>
              <div style={{ fontSize: 12, color: '#9C968F', fontWeight: 300, marginTop: 2 }}>Every item with a date, across all boards</div>
            </div>
            <CopyButton text={allBoardsUrl} id="all" />
          </div>
          <div style={{ background: '#F5F2EE', borderRadius: 4, padding: '8px 12px', fontSize: 11, color: '#5C5650', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {allBoardsUrl || 'Loading…'}
          </div>
          <a href={allBoardsUrl} download="clarityboards.ics"
            style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#2C6E8A', textDecoration: 'none', fontWeight: 300 }}>
            <Download size={12} strokeWidth={1.5} /> Download .ics file instead
          </a>
        </div>

        {/* Per-board feeds */}
        <div style={card}>
          <div style={sectionLabel}>Individual Board Feeds</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {boardUrls.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 28, height: 28, borderRadius: 4, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: SERIF, color: 'white', fontWeight: 500, flexShrink: 0 }}>
                  {b.letter}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 400, color: INK }}>{b.label}</div>
                  <div style={{ fontSize: 11, color: '#9C968F', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.url}</div>
                </div>
                <CopyButton text={b.url} id={b.id} />
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div style={card}>
          <div style={sectionLabel}>How to subscribe</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { icon: <Smartphone size={14} strokeWidth={1.5} />, title: 'iPhone / iPad (Apple Calendar)', steps: [
                'Copy the feed URL above',
                'Open Settings → Calendar → Accounts',
                'Tap Add Account → Other → Add Subscribed Calendar',
                'Paste the URL and tap Next',
                'Tap Save — done!',
              ]},
              { icon: <Monitor size={14} strokeWidth={1.5} />, title: 'Google Calendar', steps: [
                'Copy the feed URL above',
                'Open calendar.google.com',
                'Click + next to "Other calendars" → From URL',
                'Paste the URL and click Add calendar',
              ]},
              { icon: <Monitor size={14} strokeWidth={1.5} />, title: 'Outlook / Microsoft 365', steps: [
                'Copy the feed URL above',
                'Open Outlook → Calendar view',
                'Click Add calendar → Subscribe from web',
                'Paste the URL and click Import',
              ]},
            ].map((platform, i) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: INK }}>
                  <span style={{ color: '#9C968F' }}>{platform.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{platform.title}</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {platform.steps.map((step, j) => (
                    <li key={j} style={bodyText}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

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

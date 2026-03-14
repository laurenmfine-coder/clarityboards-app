'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BOARDS } from '@/lib/boards'
import { Calendar, Copy, Check, Download, Smartphone, Monitor } from 'lucide-react'
import { useTranslations } from 'next-intl'

const INK    = '#1A1714'
const BG     = '#FAFAF8'
const BORDER = '#E8E4DF'
const SUB    = '#9C968F'
const MID    = '#5C5650'
const SANS   = "'DM Sans', system-ui, sans-serif"
const SERIF  = "'Cormorant Garamond', Georgia, serif"

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

  const card: React.CSSProperties = { background: 'white', borderRadius: 8, border: `0.5px solid ${BORDER}`, padding: '20px 22px', marginBottom: 12 }
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: SUB, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 12, fontFamily: SANS }
  const body: React.CSSProperties = { fontSize: 13, color: MID, fontWeight: 300, lineHeight: 1.6 }

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button onClick={() => copyToClipboard(text, id)}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 4, border: `0.5px solid ${BORDER}`, color: MID, fontSize: 12, fontWeight: 500, background: 'white', cursor: 'pointer', flexShrink: 0, fontFamily: SANS, whiteSpace: 'nowrap' as const }}>
      {copied === id
        ? <><Check size={12} style={{ color: '#3D6B52' }} /> {t('copied')}</>
        : <><Copy size={12} /> {t('copyLink')}</>}
    </button>
  )

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
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)' }} />
          <span style={{ fontFamily: SERIF, color: 'white', fontSize: 19, fontWeight: 400, letterSpacing: '0.01em' }}>Calendar Export</span>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 80px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, paddingBottom: 20, borderBottom: `0.5px solid ${BORDER}` }}>
          <div style={{ width: 44, height: 44, borderRadius: 6, background: '#F5F2EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar size={20} color={MID} strokeWidth={1.5} />
          </div>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 26, color: INK, fontWeight: 400, letterSpacing: '0.01em', lineHeight: 1.1 }}>Calendar Export</div>
            <div style={{ fontSize: 12, color: SUB, fontWeight: 300, marginTop: 3 }}>Subscribe in Apple Calendar, Google Calendar, or Outlook</div>
          </div>
        </div>

        <div style={card}>
          <div style={lbl}>How it works</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { e: '📅', t: 'Items with dates appear as all-day events in your calendar app' },
              { e: '🔄', t: 'Updates automatically — add an item in Clarityboards, it appears in your calendar' },
              { e: '📋', t: 'Notes, status, and checklist progress are included in event descriptions' },
              { e: '🔒', t: 'Your feed URL is private — do not share it publicly' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10 }}>
                <span>{item.e}</span>
                <span style={body}>{item.t}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: INK }}>All Boards Feed</div>
              <div style={{ fontSize: 12, color: SUB, fontWeight: 300, marginTop: 2 }}>Every item with a date, across all boards</div>
            </div>
            <CopyBtn text={allBoardsUrl} id="all" />
          </div>
          <div style={{ background: '#F5F2EE', borderRadius: 4, padding: '8px 12px', fontSize: 11, color: MID, fontFamily: 'monospace', wordBreak: 'break-all' as const }}>
            {allBoardsUrl || 'Loading…'}
          </div>
          <a href={allBoardsUrl} download="clarityboards.ics"
            style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#2C6E8A', textDecoration: 'none', fontWeight: 300 }}>
            <Download size={12} strokeWidth={1.5} /> Download .ics file
          </a>
        </div>

        <div style={card}>
          <div style={lbl}>Individual Board Feeds</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {boardUrls.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 28, height: 28, borderRadius: 4, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: SERIF, color: 'white', fontWeight: 500, flexShrink: 0 }}>{b.letter}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 400, color: INK }}>{b.label}</div>
                  <div style={{ fontSize: 11, color: SUB, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{b.url}</div>
                </div>
                <CopyBtn text={b.url} id={b.id} />
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={lbl}>How to subscribe</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {[
              { icon: <Smartphone size={14} strokeWidth={1.5} />, title: 'iPhone / iPad', steps: ['Copy the feed URL above', 'Open Settings → Calendar → Accounts', 'Tap Add Account → Other → Add Subscribed Calendar', 'Paste the URL and tap Next, then Save'] },
              { icon: <Monitor size={14} strokeWidth={1.5} />, title: 'Google Calendar', steps: ['Copy the feed URL above', 'Open calendar.google.com', 'Click + next to "Other calendars" → From URL', 'Paste and click Add calendar'] },
              { icon: <Monitor size={14} strokeWidth={1.5} />, title: 'Outlook / Microsoft 365', steps: ['Copy the feed URL above', 'Open Outlook → Calendar view', 'Click Add calendar → Subscribe from web', 'Paste and click Import'] },
            ].map((p, i) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: SUB }}>{p.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: INK }}>{p.title}</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {p.steps.map((s, j) => <li key={j} style={body}>{s}</li>)}
                </ol>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase'

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Board = 'event' | 'study' | 'activity' | 'career' | 'task'
type DemoItem = {
  id: string
  board: Board
  title: string
  date: string | null
  status: string
  tags?: string[]
  checklist?: { text: string; done: boolean }[]
  priority?: 'high' | 'medium' | 'low'
  shared?: boolean
}

// â”€â”€ Board config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BOARDS = {
  event:    { label: 'EventBoard',    letter: 'E', color: '#2874A6', light: '#EBF5FB' },
  study:    { label: 'StudyBoard',    letter: 'S', color: '#1E8449', light: '#EAFAF1' },
  activity: { label: 'ActivityBoard', letter: 'A', color: '#E67E22', light: '#FEF3E8' },
  career:   { label: 'CareerBoard',   letter: 'C', color: '#8E44AD', light: '#F5EEF8' },
  task:     { label: 'TaskBoard',     letter: 'T', color: '#C0392B', light: '#FDEDEC' },
}

// â”€â”€ Demo data (sample titles stay as-is â€” not UI strings) â”€
const DEMO_ITEMS: DemoItem[] = [
  { id: '1', board: 'event',    title: "Sofia's quinceaÃ±era",      date: '2026-04-10', status: 'accepted',    priority: 'high',   shared: true, checklist: [{text:'Buy dress',done:true},{text:'Book hotel',done:false},{text:'RSVP catering',done:false}] },
  { id: '2', board: 'event',    title: 'Book club â€” March',        date: '2026-03-20', status: 'rsvp-needed', tags: ['book-club'] },
  { id: '3', board: 'activity', title: 'Jake soccer tournament',   date: '2026-03-15', status: 'todo',        priority: 'medium', shared: true },
  { id: '4', board: 'activity', title: 'Emma violin recital',      date: '2026-03-22', status: 'todo' },
  { id: '5', board: 'study',    title: 'BIO 301 midterm',          date: '2026-03-18', status: 'in-progress', priority: 'high',   tags: ['BIO301'] },
  { id: '6', board: 'study',    title: 'CHEM lab report',          date: '2026-03-25', status: 'todo',        tags: ['CHEM202'] },
  { id: '7', board: 'career',   title: 'Google SWE application',   date: '2026-03-16', status: 'submitted' },
  { id: '8', board: 'career',   title: 'Meta PM â€” follow up',      date: '2026-03-19', status: 'in-progress' },
  { id: '9', board: 'task',     title: 'Call insurance re: claim', date: '2026-03-14', status: 'todo', priority: 'high' },
  { id: '10', board: 'task',    title: 'Renew car registration',   date: '2026-03-28', status: 'todo' },
]

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function fmt(d: string | null) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function daysUntil(d: string | null) {
  if (!d) return null
  return Math.ceil((new Date(d + 'T00:00:00').getTime() - Date.now()) / 86400000)
}
function urgencyColor(d: string | null) {
  const n = daysUntil(d)
  if (n === null) return '#5A7A94'
  if (n < 0)  return '#E74C3C'
  if (n <= 7) return '#E67E22'
  return '#5A7A94'
}

// â”€â”€ Mini board monogram â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Mono({ board, size = 24 }: { board: Board; size?: number }) {
  const b = BOARDS[board]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: size * 0.28,
      background: b.color, color: '#fff',
      fontSize: size * 0.44, fontWeight: 800,
      fontFamily: 'Georgia, serif', flexShrink: 0,
    }}>{b.letter}</span>
  )
}

// â”€â”€ Priority dot â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PriorityDot({ p }: { p?: string }) {
  if (!p) return null
  const colors: Record<string, string> = { high: '#E74C3C', medium: '#E67E22', low: '#27AE60' }
  return <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors[p], display: 'inline-block', flexShrink: 0 }} />
}

// â”€â”€ Demo item card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DemoCard({ item, onClick, selected }: { item: DemoItem; onClick: () => void; selected: boolean }) {
  const b = BOARDS[item.board]
  const n = daysUntil(item.date)
  const isUrgent = n !== null && n <= 7 && n >= 0
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 12,
      background: selected ? b.light : 'white',
      border: `1.5px solid ${selected ? b.color + '60' : '#EEE'}`,
      cursor: 'pointer', transition: 'all 0.15s',
      boxShadow: selected ? `0 2px 12px ${b.color}20` : '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <Mono board={item.board} size={26} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2B3C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          {item.date && (
            <span style={{ fontSize: 11, color: urgencyColor(item.date), fontWeight: isUrgent ? 700 : 400 }}>
              {isUrgent && n === 0 ? 'Today' : isUrgent ? `${n}d` : fmt(item.date)}
            </span>
          )}
          {item.tags?.map(t => (
            <span key={t} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: b.light, color: b.color, fontWeight: 600 }}>#{t}</span>
          ))}
          {item.shared && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: '#EBF5FB', color: '#2874A6', fontWeight: 600 }}>ðŸ”—</span>}
        </div>
      </div>
      <PriorityDot p={item.priority} />
    </div>
  )
}

// â”€â”€ Detail panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DetailPanel({ item, onClose }: { item: DemoItem; onClose: () => void }) {
  const t = useTranslations('detail')
  const b = BOARDS[item.board]
  const [checks, setChecks] = useState(item.checklist ?? [])
  const [done, setDone] = useState(item.status === 'done')
  const [confetti, setConfetti] = useState(false)

  const complete = () => {
    setDone(true)
    if (checks.length >= 2) setConfetti(true)
    setTimeout(() => setConfetti(false), 2200)
  }

  return (
    <div style={{
      background: 'white', borderRadius: 16, border: `1.5px solid ${b.color}30`,
      boxShadow: `0 8px 40px ${b.color}18`, overflow: 'hidden', position: 'relative',
    }}>
      {confetti && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
          <style>{`@keyframes cf{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(200px) rotate(540deg);opacity:0}}`}</style>
          {Array.from({length:24}).map((_,i) => (
            <div key={i} style={{
              position:'absolute', left:`${Math.random()*100}%`, top:0,
              width: Math.random()*7+5, height: Math.random()*7+5,
              borderRadius: Math.random()>.5?'50%':'2px',
              background: [b.color,'#E67E22','#1E8449','#E74C3C'][i%4],
              animation:`cf ${Math.random()*1+1}s ease-in forwards`,
              animationDelay:`${Math.random()*0.4}s`,
            }}/>
          ))}
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:16, padding:'16px 28px', textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.12)' }}>
              <div style={{ fontSize:32 }}>ðŸŽ‰</div>
              <div style={{ fontWeight:800, color:'#1A2B3C', fontSize:15, marginTop:4 }}>{t('done')}</div>
            </div>
          </div>
        </div>
      )}
      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${b.color}20`, background: b.light }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Mono board={item.board} size={32} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, color:'#1A2B3C', fontSize:15 }}>{item.title}</div>
            <div style={{ fontSize:11, color: b.color, fontWeight:600, marginTop:1 }}>{b.label}</div>
          </div>
          <button onClick={onClose} style={{ color:'#9B8E7E', background:'none', border:'none', cursor:'pointer', fontSize:18, lineHeight:1 }}>Ã—</button>
        </div>
      </div>
      <div style={{ padding:'14px 18px', fontSize:13, color:'#5A7A94' }}>
        {item.date && (
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
            <span>ðŸ“…</span>
            <span style={{ color: urgencyColor(item.date), fontWeight:600 }}>{fmt(item.date)}</span>
            {daysUntil(item.date) !== null && daysUntil(item.date)! <= 7 && daysUntil(item.date)! >= 0 && (
              <span style={{ fontSize:11, background:'#FEF3E8', color:'#E67E22', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>
                {daysUntil(item.date) === 0 ? t('today') : t('daysAway', { n: daysUntil(item.date) })}
              </span>
            )}
          </div>
        )}
        {item.priority && (
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
            <PriorityDot p={item.priority} />
            <span style={{ textTransform:'capitalize', fontWeight:600, color:'#1A2B3C', fontSize:12 }}>
              {t('priority', { level: item.priority })}
            </span>
          </div>
        )}
        {item.shared && (
          <div style={{ fontSize:11, background:'#EBF5FB', color:'#2874A6', padding:'4px 10px', borderRadius:8, fontWeight:600, marginBottom:10, display:'inline-block' }}>
            {t('sharedBoard')}
          </div>
        )}
        {checks.length > 0 && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontWeight:700, color:'#1A2B3C', fontSize:12, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
              {t('checklist')}
            </div>
            <div style={{ background:'#F8F9FA', borderRadius:8, overflow:'hidden' }}>
              <div style={{ height:3, background:'#EEE', borderRadius:3, margin:'0 0 8px' }}>
                <div style={{ height:'100%', background:b.color, borderRadius:3, transition:'width 0.4s', width:`${(checks.filter(c=>c.done).length/checks.length)*100}%` }} />
              </div>
              {checks.map((c, i) => (
                <div key={i} onClick={() => setChecks(prev => prev.map((x,j) => j===i?{...x,done:!x.done}:x))}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', cursor:'pointer', borderRadius:6 }}>
                  <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${c.done?b.color:'#CCC'}`, background:c.done?b.color:'white', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                    {c.done && <span style={{ color:'white', fontSize:10, fontWeight:900 }}>âœ“</span>}
                  </div>
                  <span style={{ fontSize:12, color: c.done?'#9B8E7E':'#1A2B3C', textDecoration:c.done?'line-through':'none' }}>{c.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {!done ? (
          <button onClick={complete} style={{
            width:'100%', padding:'9px', borderRadius:10, border:'none', cursor:'pointer',
            background: b.color, color:'white', fontWeight:700, fontSize:13, transition:'opacity 0.15s',
          }}>
            {t('markComplete')}
          </button>
        ) : (
          <div style={{ textAlign:'center', padding:'8px', color:'#27AE60', fontWeight:700, fontSize:13 }}>{t('completed')}</div>
        )}
      </div>
    </div>
  )
}

// â”€â”€ SMS story bubble â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SMSBubble({ msg, visible, delay }: { msg: {from:string;text:string}; visible: boolean; delay: number }) {
  const isUser = msg.from === 'user'
  return (
    <div style={{
      display:'flex', justifyContent: isUser?'flex-end':'flex-start',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: `all 0.4s ease ${delay}s`,
    }}>
      {!isUser && (
        <div style={{ width:28, height:28, borderRadius:'50%', background:'#1A2B3C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, marginRight:8, flexShrink:0 }}>C</div>
      )}
      <div style={{
        maxWidth:'78%', padding:'10px 14px', borderRadius: isUser?'18px 18px 4px 18px':'18px 18px 18px 4px',
        background: isUser ? '#2874A6' : '#F0F0F0',
        color: isUser ? 'white' : '#1A2B3C',
        fontSize:13, lineHeight:1.5, whiteSpace:'pre-line',
        boxShadow: isUser ? '0 2px 8px rgba(40,116,166,0.25)' : '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        {msg.text}
      </div>
    </div>
  )
}

// â”€â”€ Main landing page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function LandingPage() {
  const router = useRouter()
  const tNav      = useTranslations('nav')
  const tHero     = useTranslations('hero')
  const tDemo     = useTranslations('demo')
  const tSms      = useTranslations('sms')
  const tSmsS     = useTranslations('smsStories')
  const tFeatures = useTranslations('features')
  const tPricing  = useTranslations('pricing')
  const tCta      = useTranslations('cta')
  const tFooter   = useTranslations('footer')

  const SMS_STORIES = [
    { persona: tSmsS('maria.persona'), emoji: 'âš½', color: '#E67E22',
      texts: [{ from: 'user', text: tSmsS('maria.userText') }, { from: 'app', text: tSmsS('maria.appText') }],
      result: tSmsS('maria.result') },
    { persona: tSmsS('priya.persona'), emoji: 'ðŸ“š', color: '#1E8449',
      texts: [{ from: 'user', text: tSmsS('priya.userText') }, { from: 'app', text: tSmsS('priya.appText') }],
      result: tSmsS('priya.result') },
    { persona: tSmsS('derek.persona'), emoji: 'ðŸ’¼', color: '#8E44AD',
      texts: [{ from: 'user', text: tSmsS('derek.userText') }, { from: 'app', text: tSmsS('derek.appText') }],
      result: tSmsS('derek.result') },
    { persona: tSmsS('tom.persona'), emoji: 'ðŸ ', color: '#2874A6',
      texts: [{ from: 'user', text: tSmsS('tom.userText') }, { from: 'app', text: tSmsS('tom.appText') }],
      result: tSmsS('tom.result') },
  ]

  const FEATURES = [
    { icon: 'ðŸ“±', title: tFeatures('items.capture.title'),  desc: tFeatures('items.capture.desc') },
    { icon: 'ðŸŽ¯', title: tFeatures('items.boards.title'),   desc: tFeatures('items.boards.desc') },
    { icon: 'ðŸ”—', title: tFeatures('items.share.title'),    desc: tFeatures('items.share.desc') },
    { icon: 'ðŸ”´', title: tFeatures('items.priority.title'), desc: tFeatures('items.priority.desc') },
    { icon: 'ðŸ“…', title: tFeatures('items.calendar.title'), desc: tFeatures('items.calendar.desc') },
    { icon: 'ðŸ”', title: tFeatures('items.recurring.title'),desc: tFeatures('items.recurring.desc') },
  ]

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/dashboard')
    })
  }, [router])

  const [activeBoard, setActiveBoard] = useState<Board | 'all'>('all')
  const [selectedItem, setSelectedItem] = useState<DemoItem | null>(DEMO_ITEMS[0])
  const [activeStory, setActiveStory] = useState(0)
  const [visibleBubbles, setVisibleBubbles] = useState<boolean[]>([false, false])
  const [storyPlaying, setStoryPlaying] = useState(false)
  const storyRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  const filtered = activeBoard === 'all' ? DEMO_ITEMS : DEMO_ITEMS.filter(i => i.board === activeBoard)

  const playStory = (idx: number) => {
    setActiveStory(idx)
    setVisibleBubbles([false, false])
    setStoryPlaying(true)
    setTimeout(() => setVisibleBubbles([true, false]), 300)
    setTimeout(() => setVisibleBubbles([true, true]), 1400)
    setTimeout(() => setStoryPlaying(false), 2200)
  }

  useEffect(() => { playStory(0) }, [])

  useEffect(() => {
    const el = storyRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) playStory(0)
    }, { threshold: 0.4 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const story = SMS_STORIES[activeStory]

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: '#FAFAF8', minHeight: '100vh', color: '#1A2B3C' }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #EEE' : 'none',
        transition: 'all 0.3s', padding: '0 32px',
        display: 'flex', alignItems: 'center', height: 60,
      }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#1A2B3C', letterSpacing: '-0.02em' }}>
          clarity<span style={{ color: '#2874A6' }}>boards</span>
        </div>
        <div style={{ flex: 1 }} />
        <a href="/login" style={{ fontSize: 13, color: '#5A7A94', textDecoration: 'none', marginRight: 20, fontFamily: 'system-ui' }}>
          {tNav('signIn')}
        </a>
        <a href="/onboarding" style={{
          fontSize: 13, fontWeight: 700, padding: '8px 20px', borderRadius: 10,
          background: '#1A2B3C', color: 'white', textDecoration: 'none', fontFamily: 'system-ui',
        }}>
          {tNav('getStarted')}
        </a>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: 80, paddingBottom: 60 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 48 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#EBF5FB', color: '#2874A6', borderRadius: 20,
              padding: '6px 16px', fontSize: 12, fontWeight: 700,
              fontFamily: 'system-ui', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 24,
            }}>
              {tHero('badge')}
            </div>
            <h1 style={{ fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#1A2B3C', margin: '0 0 20px' }}>
              {tHero('headline')}<br />
              <span style={{ color: '#2874A6' }}>{tHero('headlineAccent')}</span>
            </h1>
            <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: '#5A7A94', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.6, fontFamily: 'system-ui' }}>
              {tHero('subheadline')}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/onboarding" style={{ padding: '14px 32px', borderRadius: 12, background: '#1A2B3C', color: 'white', fontWeight: 800, fontSize: 15, textDecoration: 'none', fontFamily: 'system-ui', boxShadow: '0 4px 20px rgba(26,43,60,0.25)' }}>
                {tHero('ctaPrimary')}
              </a>
              <a href="#demo" style={{ padding: '14px 32px', borderRadius: 12, border: '2px solid #E8E2D9', color: '#1A2B3C', fontWeight: 700, fontSize: 15, textDecoration: 'none', fontFamily: 'system-ui', background: 'white' }}>
                {tHero('ctaSecondary')}
              </a>
            </div>
            <p style={{ marginTop: 14, fontSize: 12, color: '#B0A898', fontFamily: 'system-ui' }}>{tHero('pricingNote')}</p>
          </div>

          {/* DEMO */}
          <div id="demo" style={{ background: 'white', borderRadius: 20, boxShadow: '0 20px 80px rgba(26,43,60,0.10), 0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EEE', overflow: 'hidden' }}>
            <div style={{ background: '#1A2B3C', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display:'flex', gap:6 }}>
                {['#FF5F57','#FFBD2E','#28CA41'].map(c => <div key={c} style={{ width:11, height:11, borderRadius:'50%', background:c }} />)}
              </div>
              <div style={{ flex:1, background:'rgba(255,255,255,0.08)', borderRadius:6, padding:'4px 12px', fontSize:11, color:'rgba(255,255,255,0.5)', fontFamily:'system-ui', textAlign:'center' }}>
                {tDemo('chromeUrl')}
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontFamily:'system-ui' }}>{tDemo('tryIt')}</div>
            </div>
            <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '1px solid #EEE', background: '#F8F9FA', padding: '0 12px' }}>
              {[{ id: 'all', label: tDemo('allBoards'), color: '#1A2B3C' }, ...Object.entries(BOARDS).map(([id, b]) => ({ id, label: b.label, color: b.color }))].map(tab => (
                <button key={tab.id} onClick={() => { setActiveBoard(tab.id as any); setSelectedItem(null) }}
                  style={{ padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: activeBoard === tab.id ? 800 : 500, color: activeBoard === tab.id ? tab.color : '#9B8E7E', borderBottom: activeBoard === tab.id ? `2px solid ${tab.color}` : '2px solid transparent', whiteSpace: 'nowrap', transition: 'all 0.15s', fontFamily: 'system-ui', marginBottom: -1 }}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 360 }}>
              <div style={{ padding: 14, borderRight: '1px solid #EEE', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: 420 }}>
                {filtered.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#B0A898', fontSize: 13, fontFamily: 'system-ui' }}>{tDemo('noItems')}</div>}
                {filtered.map(item => <DemoCard key={item.id} item={item} selected={selectedItem?.id === item.id} onClick={() => setSelectedItem(item)} />)}
              </div>
              <div style={{ padding: 14, background: '#FAFAF8' }}>
                {selectedItem ? (
                  <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#B0A898' }}>
                    <div style={{ fontSize: 32 }}>ðŸ‘†</div>
                    <div style={{ fontSize: 13, fontFamily: 'system-ui' }}>{tDemo('clickToExplore')}</div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '10px 18px', background: '#F0F7FF', borderTop: '1px solid #E0EEFA', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13 }}>âœ¦</span>
              <span style={{ fontSize: 12, color: '#2874A6', fontFamily: 'system-ui', fontWeight: 600 }}>{tDemo('footerHint')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SMS SECTION */}
      <section ref={storyRef} style={{ padding: '80px 24px', background: '#1A2B3C' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2874A6', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'system-ui', marginBottom: 14 }}>{tSms('badge')}</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>{tSms('headline')}</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', marginTop: 12, fontFamily: 'system-ui', maxWidth: 480, margin: '12px auto 0' }}>{tSms('subheadline')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)', gap: 40, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SMS_STORIES.map((s, i) => (
                <button key={i} onClick={() => playStory(i)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14, background: activeStory === i ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)', border: `1.5px solid ${activeStory === i ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: 24, flexShrink: 0 }}>{s.emoji}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: activeStory === i ? 'white' : 'rgba(255,255,255,0.7)', fontFamily: 'system-ui' }}>{s.persona}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontFamily: 'system-ui' }}>{s.result.slice(0, 48)}â€¦</div>
                  </div>
                  {activeStory === i && <div style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background: s.color, flexShrink:0 }} />}
                </button>
              ))}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2874A6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', fontWeight: 800 }}>C</div>
                <div>
                  <div style={{ fontSize: 12, color: 'white', fontWeight: 700, fontFamily: 'system-ui' }}>{tSms('name')}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui' }}>{tSms('phone')}</div>
                </div>
                <div style={{ marginLeft:'auto', fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'system-ui' }}>Messages</div>
              </div>
              <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 180 }}>
                {story.texts.map((msg, i) => <SMSBubble key={`${activeStory}-${i}`} msg={msg} visible={visibleBubbles[i] ?? false} delay={0} />)}
              </div>
              <div style={{ margin: '0 14px 14px', padding: '10px 14px', borderRadius: 10, background: story.color + '20', border: `1px solid ${story.color}40`, opacity: visibleBubbles[1] ? 1 : 0, transition: 'opacity 0.4s 0.3s' }}>
                <div style={{ fontSize: 12, color: story.color, fontWeight: 700, fontFamily: 'system-ui' }}>âœ¦ {story.result}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '80px 24px', background: '#FAFAF8' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              {tFeatures('headline')}<br /><span style={{ color: '#2874A6' }}>{tFeatures('headlineAccent')}</span>
            </h2>
            <p style={{ fontSize: 15, color: '#5A7A94', fontFamily: 'system-ui', maxWidth: 440, margin: '0 auto' }}>{tFeatures('subheadline')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 16, padding: '22px 24px', border: '1px solid #EEE', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform='translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 8px 32px rgba(0,0,0,0.09)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform='translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 2px 12px rgba(0,0,0,0.04)' }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#1A2B3C', marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#5A7A94', lineHeight: 1.6, fontFamily: 'system-ui' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>{tPricing('headline')}</h2>
          <p style={{ fontSize: 15, color: '#5A7A94', fontFamily: 'system-ui', marginBottom: 40 }}>{tPricing('subheadline')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 560, margin: '0 auto' }}>
            {[
              { key: 'free', highlighted: false, accent: '#5A7A94', href: '/onboarding' },
              { key: 'pro',  highlighted: true,  accent: '#2874A6', href: '/onboarding' },
            ].map(({ key, highlighted, href }) => {
              const features = tPricing.raw(`${key}.features`) as string[]
              return (
                <div key={key} style={{ borderRadius: 18, padding: '28px 24px', background: highlighted ? '#1A2B3C' : 'white', border: `2px solid ${highlighted ? '#1A2B3C' : '#EEE'}`, textAlign: 'left', boxShadow: highlighted ? '0 12px 48px rgba(26,43,60,0.25)' : 'none' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: highlighted ? 'rgba(255,255,255,0.5)' : '#9B8E7E', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'system-ui', marginBottom: 8 }}>{tPricing(`${key}.name` as any)}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: highlighted ? 'white' : '#1A2B3C', letterSpacing: '-0.02em' }}>{tPricing(`${key}.price` as any)}</div>
                  <div style={{ fontSize: 12, color: highlighted ? 'rgba(255,255,255,0.4)' : '#9B8E7E', fontFamily: 'system-ui', marginBottom: 20 }}>{tPricing(`${key}.desc` as any)}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 24 }}>
                    {features.map((f: string) => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: highlighted ? 'rgba(255,255,255,0.8)' : '#5A7A94', fontFamily: 'system-ui' }}>
                        <span style={{ color: highlighted ? '#2874A6' : '#27AE60', fontWeight: 800 }}>âœ“</span> {f}
                      </div>
                    ))}
                  </div>
                  <a href={href} style={{ display: 'block', textAlign: 'center', padding: '11px', borderRadius: 10, textDecoration: 'none', background: highlighted ? '#2874A6' : '#F5F2EC', color: highlighted ? 'white' : '#1A2B3C', fontWeight: 700, fontSize: 13, fontFamily: 'system-ui' }}>
                    {tPricing(`${key}.cta` as any)}
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', background: '#EBF5FB', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            {tCta('headline')}<br /><span style={{ color: '#2874A6' }}>{tCta('headlineAccent')}</span>
          </h2>
          <p style={{ fontSize: 15, color: '#5A7A94', marginBottom: 32, fontFamily: 'system-ui', lineHeight: 1.6 }}>{tCta('subheadline')}</p>
          <a href="/onboarding" style={{ display: 'inline-block', padding: '16px 40px', borderRadius: 14, background: '#1A2B3C', color: 'white', fontWeight: 800, fontSize: 16, textDecoration: 'none', fontFamily: 'system-ui', boxShadow: '0 8px 32px rgba(26,43,60,0.25)' }}>
            {tCta('button')}
          </a>
          <p style={{ marginTop: 14, fontSize: 12, color: '#9B8E7E', fontFamily: 'system-ui' }}>{tCta('footnote')}</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '28px 24px', background: '#1A2B3C', textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: 'white', marginBottom: 8 }}>
          clarity<span style={{ color: '#2874A6' }}>boards</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'system-ui' }}>
          {tFooter('copyright')} Â· <a href="/privacy" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{tFooter('privacy')}</a> Â· <a href="/terms" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{tFooter('terms')}</a>
        </div>
      </footer>
    </div>
  )
}


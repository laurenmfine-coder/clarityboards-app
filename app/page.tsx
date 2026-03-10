'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BOARDS } from '@/lib/boards'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [joined, setJoined] = useState(false)

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  const GoogleBtn = ({ label = 'Get started free →', large = false }) => (
    <button
      onClick={handleGoogle}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-3 bg-[#1B4F8A] text-white font-semibold rounded-xl hover:bg-[#15407A] transition-all disabled:opacity-50 ${large ? 'px-8 py-4 text-base' : 'px-6 py-3 text-sm'}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" className="flex-shrink-0">
        <path fill="#fff" opacity=".9" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#fff" opacity=".9" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#fff" opacity=".9" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#fff" opacity=".9" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {loading ? 'Signing in…' : label}
    </button>
  )

  const sampleItems = [
    { title: "Emma's Bat Mitzvah", date: 'Mar 28', status: 'RSVP Needed', color: '#1B4F8A', letter: 'E', pct: 25 },
    { title: 'AP History Essay — WWI Causes', date: '5d away', status: 'In Progress', color: '#2E9E8F', letter: 'S', pct: 57 },
    { title: 'Dance Recital — Spring Show', date: 'Apr 7', status: 'To Do', color: '#E67E22', letter: 'A', pct: 20 },
    { title: 'Interview — Product Manager, Acme', date: '4d away', status: 'In Progress', color: '#8E44AD', letter: 'C', pct: 66 },
    { title: 'Plan Summer Family Vacation', date: 'May 9', status: 'In Progress', color: '#27AE60', letter: 'T', pct: 40 },
  ]

  const statusStyle: Record<string, { bg: string; color: string }> = {
    'RSVP Needed': { bg: '#EBF3FB', color: '#1B4F8A' },
    'In Progress':  { bg: '#E8F8F6', color: '#2E9E8F' },
    'To Do':        { bg: '#FEF3E8', color: '#E67E22' },
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#F4F7FA', color: '#1A2B3C' }}>

      {/* ── STICKY NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #EBF3FB' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[['#F5A623','#D4E6F1'],['#D4E6F1','#2E9E8F']].map((pair, r) => (
                <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {pair.map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: c }} />)}
                </div>
              ))}
            </div>
            <span style={{ fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '1.2rem', color: '#1B4F8A' }}>Clarityboards</span>
          </div>
          <a href="#how" style={{ fontSize: '0.875rem', color: '#5A7A94', textDecoration: 'none', fontWeight: 500 }}>How it works</a>
          <a href="#boards" style={{ fontSize: '0.875rem', color: '#5A7A94', textDecoration: 'none', fontWeight: 500 }}>The boards</a>
          <a href="#pricing" style={{ fontSize: '0.875rem', color: '#5A7A94', textDecoration: 'none', fontWeight: 500 }}>Pricing</a>
          <GoogleBtn label="Sign in →" />
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '7rem 2rem 5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EBF3FB', borderRadius: 999, padding: '6px 14px', marginBottom: '1.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27AE60' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1B4F8A' }}>Now in prototype · Invited testers only</span>
          </div>

          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '3.5rem', fontWeight: 'bold', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            One place for your <em style={{ color: '#1B4F8A', fontStyle: 'italic' }}>whole</em> life.
          </h1>

          <p style={{ fontSize: '1.125rem', color: '#5A7A94', lineHeight: 1.7, marginBottom: '2rem', maxWidth: 480 }}>
            Invitations, assignments, sports schedules, job interviews, and personal projects — 
            all in one organized feed, sorted by when they happen.
          </p>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <GoogleBtn label="Get started free →" large />
            <span style={{ fontSize: '0.8rem', color: '#5A7A94' }}>Free forever · No credit card</span>
          </div>
          {error && <p style={{ marginTop: 12, color: '#E74C3C', fontSize: '0.875rem' }}>{error}</p>}
        </div>

        {/* Dashboard preview */}
        <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 20px 60px rgba(27,79,138,0.12)', overflow: 'hidden', border: '1px solid #EBF3FB' }}>
          {/* Mini nav */}
          <div style={{ background: '#1A2B3C', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[['#F5A623','#D4E6F1'],['#D4E6F1','#2E9E8F']].map((pair, r) => (
                <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {pair.map((c, i) => <div key={i} style={{ width: 7, height: 7, borderRadius: 2, background: c }} />)}
                </div>
              ))}
            </div>
            <span style={{ color: 'white', fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '0.85rem' }}>Clarityboards</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              {BOARDS.map(b => (
                <div key={b.id} style={{ width: 22, height: 22, borderRadius: 6, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>{b.letter}</div>
              ))}
            </div>
          </div>
          {/* Stats strip */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #EBF3FB', display: 'flex', gap: 20 }}>
            {[['2','This week','#1B4F8A'],['2','RSVPs needed','#F5A623'],['13','Open items','#2E9E8F']].map(([n,l,c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '1.2rem', color: c }}>{n}</span>
                <span style={{ fontSize: '0.7rem', color: '#5A7A94' }}>{l}</span>
              </div>
            ))}
          </div>
          {/* Items */}
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sampleItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', background: '#F4F7FA', borderRadius: 12, overflow: 'hidden', borderLeft: `3px solid ${item.color}` }}>
                <div style={{ flex: 1, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 5, background: item.color, color: 'white', fontSize: 9, fontFamily: 'Georgia, serif', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.letter}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1A2B3C', flex: 1 }}>{item.title}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: statusStyle[item.status]?.bg, color: statusStyle[item.status]?.color, flexShrink: 0 }}>{item.status}</span>
                  </div>
                  <div style={{ height: 3, background: '#EBF3FB', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 99 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ background: 'white', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', color: '#5A7A94', textTransform: 'uppercase', marginBottom: '1rem' }}>How it works</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
            Built for how life <em style={{ color: '#1B4F8A', fontStyle: 'italic' }}>actually</em> works.
          </h2>
          <p style={{ textAlign: 'center', color: '#5A7A94', fontSize: '1.1rem', maxWidth: 560, margin: '0 auto 4rem' }}>
            Not how productivity apps assume it does. Life doesn't fit into one tool type — so Clarityboards doesn't ask it to.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {[
              { icon: '📨', title: 'Forward anything in', body: 'Get a paper invitation? Text a photo. Evite link? Paste it. Email invite? Forward it. Everything lands in your EventBoard automatically — no manual typing required.' },
              { icon: '☑️', title: 'Track what still needs doing', body: 'Every item has a checklist. Every checklist shows progress. The unified feed tells you what is coming up and what still needs to happen before it does.' },
              { icon: '📅', title: 'See it all in one place', body: 'Five boards, one chronological feed. Filter to a single board anytime. Color-coded, urgency-flagged, and sorted by date — not by which app you remembered to open.' },
            ].map(f => (
              <div key={f.title} style={{ background: '#F4F7FA', borderRadius: 16, padding: '2rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#1A2B3C' }}>{f.title}</h3>
                <p style={{ color: '#5A7A94', fontSize: '0.9rem', lineHeight: 1.7 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOARDS ── */}
      <section id="boards" style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', color: '#5A7A94', textTransform: 'uppercase', marginBottom: '1rem' }}>The boards</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
            Five boards. Every <em style={{ color: '#1B4F8A', fontStyle: 'italic' }}>role</em> you play.
          </h2>
          <p style={{ textAlign: 'center', color: '#5A7A94', fontSize: '1.1rem', maxWidth: 560, margin: '0 auto 4rem' }}>
            Each board is purpose-built for a different domain of your life. Use one or all five.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
            {[
              { letter: 'E', name: 'EventBoard', color: '#1B4F8A', bg: '#EBF3FB', tagline: 'Milestone invitations & RSVPs', items: ['Bar Mitzvahs', 'Quinceañeras', 'Weddings', 'Graduations', 'Birthdays'] },
              { letter: 'S', name: 'StudyBoard', color: '#2E9E8F', bg: '#E8F8F6', tagline: 'Assignments & deadlines', items: ['Due dates', 'Progress tracking', 'Supply lists', 'Multi-class view'] },
              { letter: 'A', name: 'ActivityBoard', color: '#E67E22', bg: '#FEF3E8', tagline: "Kids' sports & activities", items: ['Practice schedules', 'Game days', 'Fees & dues', 'Snack assignments', 'Recital logistics'] },
              { letter: 'C', name: 'CareerBoard', color: '#8E44AD', bg: '#F5EEF8', tagline: 'Interviews & applications', items: ['Interview prep', 'STAR stories', 'Follow-up tasks', 'Application status'] },
              { letter: 'T', name: 'TaskBoard', color: '#27AE60', bg: '#EAFAF1', tagline: 'Projects & to-dos', items: ['Personal projects', 'Recurring tasks', 'Household tasks', 'Any deadline'] },
            ].map(b => (
              <div key={b.name} style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: `1px solid ${b.bg}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '1.25rem' }}>{b.letter}</div>
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '1rem', color: '#1A2B3C', marginBottom: 4 }}>{b.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#5A7A94', fontStyle: 'italic' }}>{b.tagline}</div>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {b.items.map(item => (
                    <li key={item} style={{ fontSize: '0.75rem', color: '#5A7A94', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: b.color, fontWeight: 'bold' }}>·</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ background: 'white', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', color: '#5A7A94', textTransform: 'uppercase', marginBottom: '1rem' }}>Pricing</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
            Simple, <em style={{ color: '#1B4F8A', fontStyle: 'italic' }}>honest</em> pricing.
          </h2>
          <p style={{ textAlign: 'center', color: '#5A7A94', fontSize: '1.1rem', marginBottom: '3rem' }}>
            Start free. Upgrade when the app earns it — not before.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {[
              { name: 'Free', price: '$0', sub: 'forever, no credit card', color: '#5A7A94', features: ['All five boards — unlimited items', 'Email forwarding ingestion', 'SMS photo ingestion (paper invites)', 'Link paste from Evite & Paperless Post', 'Checklist system with progress tracking', 'Calendar export (.ics)', 'Household sharing — up to 2 members', 'Deadline reminders'], cta: 'Get started free →', primary: false },
              { name: 'Pro', price: '$14.99', sub: 'per month · or $99/year', color: '#1B4F8A', features: ['Everything in Free', 'Household sharing — up to 5 members', 'Custom reminder schedules', 'Gift tracker per event', 'AI-assisted thank-you notes', 'Recurring tasks', 'Full data export (PDF or CSV)', 'Priority support · Early access'], cta: 'Coming soon', primary: true },
            ].map(tier => (
              <div key={tier.name} style={{ borderRadius: 20, padding: '2.5rem', border: tier.primary ? `2px solid #1B4F8A` : '1px solid #EBF3FB', background: tier.primary ? '#EBF3FB' : 'white' }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 'bold', color: tier.color, marginBottom: 4 }}>{tier.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: '2.5rem', fontWeight: 'bold', color: '#1A2B3C' }}>{tier.price}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#5A7A94', marginBottom: '1.5rem' }}>{tier.sub}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 8, fontSize: '0.875rem', color: '#1A2B3C' }}>
                      <span style={{ color: '#27AE60', fontWeight: 'bold', flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                {tier.primary ? (
                  <div style={{ background: '#D4E6F1', borderRadius: 12, padding: '12px 24px', textAlign: 'center', fontSize: '0.875rem', color: '#5A7A94', fontWeight: 600 }}>Coming soon</div>
                ) : (
                  <GoogleBtn label={tier.cta} large />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
            Your life has a lot going on. <em style={{ color: '#1B4F8A', fontStyle: 'italic' }}>Clarityboards</em> keeps up.
          </h2>
          <p style={{ color: '#5A7A94', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Free to start. Sign in with Google and your boards are ready in seconds.
          </p>
          <GoogleBtn label="Get started free →" large />
          {error && <p style={{ marginTop: 12, color: '#E74C3C', fontSize: '0.875rem' }}>{error}</p>}
          <p style={{ marginTop: 16, fontSize: '0.8rem', color: '#5A7A94' }}>Prototype · Invited testers only · No spam, ever</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#1A2B3C', padding: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['#F5A623','#D4E6F1'],['#D4E6F1','#2E9E8F']].map((pair, r) => (
              <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {pair.map((c, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: c }} />)}
              </div>
            ))}
          </div>
          <span style={{ fontFamily: 'Georgia, serif', fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>Clarityboards</span>
        </div>
        <p style={{ color: '#5A7A94', fontSize: '0.8rem' }}>© 2026 Clarityboards · clarityboards.com · hello@clarityboards.com</p>
      </footer>
    </div>
  )
}

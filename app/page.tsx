'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BOARDS } from '@/lib/boards'

function GoogleBtn({ label = 'Get started free →', large = false, onClick }: { label?: string; large?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#1B4F8A', color: 'white', fontWeight: 600, borderRadius: 12, border: 'none', padding: large ? '14px 28px' : '10px 20px', fontSize: large ? '1rem' : '0.875rem' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {label}
    </button>
  )
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  const sampleItems = [
    { title: "Emma's Bat Mitzvah",            color: '#1B4F8A', letter: 'E', status: 'RSVP Needed', statusBg: '#EBF3FB', statusColor: '#1B4F8A', pct: 25 },
    { title: 'AP History Essay — WWI Causes', color: '#2E9E8F', letter: 'S', status: 'In Progress',  statusBg: '#E8F8F6', statusColor: '#2E9E8F', pct: 57 },
    { title: 'Dance Recital — Spring Show',   color: '#E67E22', letter: 'A', status: 'To Do',        statusBg: '#FEF3E8', statusColor: '#E67E22', pct: 20 },
    { title: 'Interview — Product Manager',   color: '#8E44AD', letter: 'C', status: 'In Progress',  statusBg: '#F5EEF8', statusColor: '#8E44AD', pct: 66 },
    { title: 'Plan Summer Family Vacation',   color: '#27AE60', letter: 'T', status: 'In Progress',  statusBg: '#EAFAF1', statusColor: '#27AE60', pct: 40 },
  ]

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#F4F7FA', color: '#1A2B3C' }}>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #EBF3FB' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[['#F5A623','#D4E6F1'],['#D4E6F1','#2E9E8F']].map((pair, r) => (
                <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {pair.map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: c }} />)}
                </div>
              ))}
            </div>
            <span style={{ fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '1.2rem', color: '#1B4F8A' }}>Clarityboards</span>
          </div>
          <a href="#how"     style={{ fontSize: '0.875rem', color: '#5A7A94', textDecoration: 'none', fontWeight: 500 }}>How it works</a>
          <a href="#boards"  style={{ fontSize: '0.875rem', color: '#5A7A94', textDecoration: 'none', fontWeight: 500 }}>The boards</a>
          <a href="#pricing" style={{ fontSize: '0.875rem', color: '#5A7A94', textDecoration: 'none', fontWeight: 500 }}>Pricing</a>
          <GoogleBtn label={loading ? 'Signing in…' : 'Sign in →'} onClick={handleGoogle} />
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '6rem 2rem 4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EBF3FB', borderRadius: 999, padding: '6px 14px', marginBottom: '1.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27AE60' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1B4F8A' }}>Now in prototype · Invited testers only</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '3.5rem', fontWeight: 'bold', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            One place for your <em style={{ color: '#1B4F8A' }}>whole</em> life.
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#5A7A94', lineHeight: 1.7, marginBottom: '2rem' }}>
            Invitations, assignments, sports schedules, job interviews, and personal projects — all in one organized feed, sorted by when they happen.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <GoogleBtn label={loading ? 'Signing in…' : 'Get started free →'} large onClick={handleGoogle} />
            <span style={{ fontSize: '0.8rem', color: '#5A7A94' }}>Free forever · No credit card</span>
          </div>
          {error && <p style={{ marginTop: 12, color: '#E74C3C', fontSize: '0.875rem' }}>{error}</p>}
        </div>

        {/* Dashboard preview */}
        <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 20px 60px rgba(27,79,138,0.12)', overflow: 'hidden', border: '1px solid #EBF3FB' }}>
          <div style={{ background: '#1A2B3C', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {[['#F5A623','#D4E6F1'],['#D4E6F1','#2E9E8F']].map((pair, r) => (
                <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {pair.map((c,i) => <div key={i} style={{ width: 7, height: 7, borderRadius: 2, background: c }} />)}
                </div>
              ))}
            </div>
            <span style={{ color: 'white', fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '0.85rem', marginLeft: 4 }}>Clarityboards</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
              {BOARDS.map(b => <div key={b.id} style={{ width: 22, height: 22, borderRadius: 6, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>{b.letter}</div>)}
            </div>
          </div>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #EBF3FB', display: 'flex', gap: 20 }}>
            {[['2','This week','#1B4F8A'],['2','RSVPs needed','#F5A623'],['13','Open items','#2E9E8F']].map(([n,l,c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '1.1rem', color: c }}>{n}</span>
                <span style={{ fontSize: '0.7rem', color: '#5A7A94' }}>{l}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {sampleItems.map((item, i) => (
              <div key={i} style={{ background: '#F4F7FA', borderRadius: 10, overflow: 'hidden', borderLeft: `3px solid ${item.color}`, opacity: 1 - i * 0.08 }}>
                <div style={{ padding: '9px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 5, background: item.color, color: 'white', fontSize: 9, fontFamily: 'Georgia, serif', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.letter}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1A2B3C', flex: 1 }}>{item.title}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: item.statusBg, color: item.statusColor, flexShrink: 0 }}>{item.status}</span>
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

      {/* HOW IT WORKS */}
      <section id="how" style={{ background: 'white', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', color: '#5A7A94', textTransform: 'uppercase', marginBottom: '1rem' }}>How it works</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem' }}>
            Built for how life <em style={{ color: '#1B4F8A' }}>actually</em> works.
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
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>{f.title}</h3>
                <p style={{ color: '#5A7A94', fontSize: '0.9rem', lineHeight: 1.7 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOARDS */}
      <section id="boards" style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', color: '#5A7A94', textTransform: 'uppercase', marginBottom: '1rem' }}>The boards</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem' }}>
            Five boards. Every <em style={{ color: '#1B4F8A' }}>role</em> you play.
          </h2>
          <p style={{ textAlign: 'center', color: '#5A7A94', fontSize: '1.1rem', maxWidth: 560, margin: '0 auto 4rem' }}>
            Each board is purpose-built for a different domain of your life. Use one or all five.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
            {[
              { letter: 'E', name: 'EventBoard',    color: '#1B4F8A', bg: '#EBF3FB', tagline: 'Milestone invitations & RSVPs',    items: ['Bar Mitzvahs','Quinceañeras','Weddings','Graduations','Birthdays'] },
              { letter: 'S', name: 'StudyBoard',    color: '#2E9E8F', bg: '#E8F8F6', tagline: 'Assignments & deadlines',           items: ['Due dates','Progress tracking','Supply lists','Multi-class view'] },
              { letter: 'A', name: 'ActivityBoard', color: '#E67E22', bg: '#FEF3E8', tagline: "Kids' sports & activities",         items: ['Practice schedules','Game days','Fees & dues','Snack assignments','Recital logistics'] },
              { letter: 'C', name: 'CareerBoard',   color: '#8E44AD', bg: '#F5EEF8', tagline: 'Interviews & applications',         items: ['Interview prep','STAR stories','Follow-up tasks','Application status'] },
              { letter: 'T', name: 'TaskBoard',     color: '#27AE60', bg: '#EAFAF1', tagline: 'Projects & to-dos',                 items: ['Personal projects','Recurring tasks','Household tasks','Any deadline'] },
            ].map(b => (
              <div key={b.name} style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: `1px solid ${b.bg}` }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '1.25rem', marginBottom: 12 }}>{b.letter}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '1rem', marginBottom: 4 }}>{b.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#5A7A94', fontStyle: 'italic', marginBottom: 12 }}>{b.tagline}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {b.items.map(item => (
                    <li key={item} style={{ fontSize: '0.75rem', color: '#5A7A94', marginBottom: 4, display: 'flex', gap: 6 }}>
                      <span style={{ color: b.color, fontWeight: 'bold' }}>·</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ background: 'white', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', color: '#5A7A94', textTransform: 'uppercase', marginBottom: '1rem' }}>Pricing</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem' }}>
            Simple, <em style={{ color: '#1B4F8A' }}>honest</em> pricing.
          </h2>
          <p style={{ textAlign: 'center', color: '#5A7A94', fontSize: '1.1rem', marginBottom: '3rem' }}>Start free. Upgrade when the app earns it — not before.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {[
              { name: 'Free', price: '$0', sub: 'forever, no credit card', color: '#5A7A94', border: '#EBF3FB', bg: 'white', features: ['Choose 2 boards to start','Up to 10 active items','Up to 3 checklist tasks per item','Deadline reminders','Link paste (Evite, Paperless Post)','Household sharing — up to 2 members','Calendar export (.ics)'], primary: false },
              { name: 'Pro',  price: '$4.99', sub: 'per month · or $49/year · FREE during demo', color: '#1B4F8A', border: '#1B4F8A', bg: '#EBF3FB', features: ['Everything in Free','All 5 boards (Free: choose 2)','Unlimited items (Free: 10 max)','Unlimited checklist tasks (Free: 3 per item)','Household sharing — up to 5 members','AI text & email forwarding to your boards','Custom reminder schedules','Gift tracker per event','Full data export · Priority support'], primary: true },
            ].map(tier => (
              <div key={tier.name} style={{ borderRadius: 20, padding: '2.5rem', border: `2px solid ${tier.border}`, background: tier.bg }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 'bold', color: tier.color, marginBottom: 8 }}>{tier.name}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '2.5rem', fontWeight: 'bold', color: '#1A2B3C', marginBottom: 4 }}>{tier.price}</div>
                <div style={{ fontSize: '0.8rem', color: '#5A7A94', marginBottom: '1.5rem' }}>{tier.sub}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem' }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 8, fontSize: '0.875rem', marginBottom: 10 }}>
                      <span style={{ color: '#27AE60', fontWeight: 'bold', flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                {tier.primary
                  ? <>
                      <div style={{ background: '#1B4F8A', borderRadius: 12, padding: '4px 14px', display: 'inline-block', marginBottom: 12 }}>
                        <span style={{ color: '#F5A623', fontWeight: 700, fontSize: '0.8rem' }}>🎉 FREE during demo period</span>
                      </div>
                      <br />
                      <GoogleBtn label="Get Pro free →" large onClick={handleGoogle} />
                    </>
                  : <GoogleBtn label="Get started free →" large onClick={handleGoogle} />
                }
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Your life has a lot going on. <em style={{ color: '#1B4F8A' }}>Clarityboards</em> keeps up.
          </h2>
          <p style={{ color: '#5A7A94', fontSize: '1.1rem', marginBottom: '2rem' }}>Free to start. Sign in with Google and your boards are ready in seconds.</p>
          <GoogleBtn label={loading ? 'Signing in…' : 'Get started free →'} large onClick={handleGoogle} />
          {error && <p style={{ marginTop: 12, color: '#E74C3C', fontSize: '0.875rem' }}>{error}</p>}
          <p style={{ marginTop: 16, fontSize: '0.8rem', color: '#5A7A94' }}>Prototype · Invited testers only · No spam, ever</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#1A2B3C', padding: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['#F5A623','#D4E6F1'],['#D4E6F1','#2E9E8F']].map((pair, r) => (
              <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {pair.map((c,i) => <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: c }} />)}
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

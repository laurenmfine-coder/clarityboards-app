'use client';
export default function LandingPage() {
  const wrapStyle = {
    fontFamily: "'DM Sans', system-ui, sans-serif",
    background: '#F7F4F0',
    color: '#1A1714',
    minHeight: '100vh',
  }
  return (
    <div style={wrapStyle}>

      {/* Nav */}
      <nav style={{ background: '#1A1714', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'white', fontSize: 20, fontWeight: 400 }}>Clarityboards</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Sign in</a>
          <a href="/dashboard" style={{ background: '#2E9E8F', color: 'white', padding: '7px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>Try free →</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '72px 24px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#E8F8F6', color: '#2E9E8F', fontSize: 12, fontWeight: 500, padding: '4px 14px', borderRadius: 20, marginBottom: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Free to start</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(32px,5vw,52px)', fontWeight: 400, color: '#1A1714', lineHeight: 1.15, marginBottom: 20 }}>Stop building Notion. Start using something that's already built.</h1>
        <p style={{ fontSize: 17, color: '#6B6059', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 32px' }}>Notion is powerful, but most students spend more time organizing their workspace than actually studying. Clarityboards has a StudyBoard that works on day one — no templates, no databases, no YouTube tutorials.</p>
        <a href="/dashboard" style={{ display: 'inline-block', background: '#1A1714', color: 'white', padding: '14px 36px', borderRadius: 8, fontSize: 15, fontWeight: 500, letterSpacing: '0.01em' }}>Start your StudyBoard free →</a>
        <div style={{ marginTop: 14, fontSize: 12, color: '#9C8878' }}>No credit card · No download · Works on any device</div>
      </div>

      {/* Pain section */}
      <div style={{ background: 'white', borderTop: '0.5px solid #C8BFB5', borderBottom: '0.5px solid #C8BFB5' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '52px 24px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(22px,3vw,32px)', fontWeight: 400, color: '#1A1714', marginBottom: 32, textAlign: 'center' }}>Sound like your semester?</h2>
          
              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#E8F8F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#2E9E8F" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>You spend Sunday setting up Notion instead of studying</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>The database, the linked views, the templates — it takes hours to build and minutes to abandon.</div>
                </div>
              </div>

              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#E8F8F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#2E9E8F" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>Your deadlines are in three different places</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Canvas, phone reminders, sticky notes, and a planner that's already two weeks behind.</div>
                </div>
              </div>

              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#E8F8F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#2E9E8F" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>You check off a task and it disappears forever</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Did you submit that paper? Did you finish that problem set? With most apps, you'll never know.</div>
                </div>
              </div>

              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#E8F8F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#2E9E8F" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>Your study system collapses by week 4</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>You start with a great setup. Then life happens and the system gets too complex to maintain.</div>
                </div>
              </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 24px' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(22px,3vw,32px)', fontWeight: 400, color: '#1A1714', marginBottom: 32, textAlign: 'center' }}>What makes Clarityboards different</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          
              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#E8F8F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E9E8F" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>StudyBoard ready in 60 seconds</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Add assignments, set due dates, mark as In Progress or Submitted. Works before you finish your first coffee.</div>
              </div>

              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#E8F8F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E9E8F" strokeWidth="1.5"><path d="M5 8h14M5 8a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2M5 8V6a2 2 0 012-2h10a2 2 0 012 2v2"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>Archive proves you did the work</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Completed assignments move to an archive, not a trash can. You can restore anything — useful when a professor says they never got your submission.</div>
              </div>

              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#E8F8F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E9E8F" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>⌘J anywhere to add a task</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Keyboard shortcut opens the add modal instantly. Faster than Todoist, cleaner than a sticky note.</div>
              </div>

              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#E8F8F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E9E8F" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>Dark mode for late nights</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Beautiful warm dark mode that doesn't blast your eyes at 2am. Switch with one click.</div>
              </div>
        </div>
      </div>

      {/* Testimonial */}
      <div style={{ background: '#1A1714', padding: '52px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(18px,2.5vw,26px)', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 20 }}>"I deleted Notion last week. I was spending 30 minutes a week just organizing Notion instead of actually doing work. Clarityboards is already set up — I just use it."</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>— Maya, college sophomore · Deleted Notion after switching</div>
        </div>
      </div>

      {/* Comparison */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 400, color: '#1A1714', marginBottom: 24, textAlign: 'center' }}>How it compares to Notion</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 12, overflow: 'hidden', border: '0.5px solid #C8BFB5' }}>
            <thead>
              <tr style={{ background: '#1A1714' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Feature</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'white' }}>Clarityboards</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>Notion</th>
              </tr>
            </thead>
            <tbody>
              
                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Works on day one</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✗ Must build first</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Task archive (proof of work)</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#A32D2D', fontWeight: '500' }}}>✗</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>No learning curve</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✗ ~40 hrs to master</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>⌘J quick-add</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>~</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Dark mode</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Free tier</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✓ Generous</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✓ Limited</td>
                  </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#E8F8F6', borderTop: '0.5px solid #2E9E8F30', padding: '60px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 400, color: '#1A1714', marginBottom: 16 }}>Ready to try it?</h2>
        <p style={{ fontSize: 15, color: '#6B6059', marginBottom: 28 }}>Free to start. No credit card. Works on any device.</p>
        <a href="/dashboard" style={{ display: 'inline-block', background: '#1A1714', color: 'white', padding: '14px 40px', borderRadius: 8, fontSize: 15, fontWeight: 500 }}>Start for free →</a>
      </div>

      {/* Footer */}
      <div style={{ background: '#1A1714', padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 12 }}>Clarityboards</div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.3)' }}>Home</a>
          <a href="/for-parents" style={{ color: 'rgba(255,255,255,0.3)' }}>For parents</a>
          <a href="/for-students" style={{ color: 'rgba(255,255,255,0.3)' }}>For students</a>
          <a href="/for-educators" style={{ color: 'rgba(255,255,255,0.3)' }}>For educators</a>
          <a href="/for-freelancers" style={{ color: 'rgba(255,255,255,0.3)' }}>For freelancers</a>
          <a href="/for-caregivers" style={{ color: 'rgba(255,255,255,0.3)' }}>For caregivers</a>
          <a href="/cozi-alternative" style={{ color: 'rgba(255,255,255,0.3)' }}>Cozi alternative</a>
        </div>
      </div>
    </div>
  );
}

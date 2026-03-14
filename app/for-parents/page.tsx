'use client';
import React from 'react';
export default function LandingPage() {
  const wrapStyle: React.CSSProperties = {
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
          <a href="/dashboard" style={{ background: '#E67E22', color: 'white', padding: '7px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>Try free →</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '72px 24px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#FEF3E8', color: '#E67E22', fontSize: 12, fontWeight: 500, padding: '4px 14px', borderRadius: 20, marginBottom: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Free to start</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(32px,5vw,52px)', fontWeight: 400, color: '#1A1714', lineHeight: 1.15, marginBottom: 20 }}>The family planner your partner will actually use.</h1>
        <p style={{ fontSize: 17, color: '#6B6059', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 32px' }}>Most family apps require everyone to want to use the family app. Clarityboards looks good enough that people open it on their own — and contributor editing means your partner can actually add things without asking you to do it.</p>
        <a href="/dashboard" style={{ display: 'inline-block', background: '#1A1714', color: 'white', padding: '14px 36px', borderRadius: 8, fontSize: 15, fontWeight: 500, letterSpacing: '0.01em' }}>Start your family board free →</a>
        <div style={{ marginTop: 14, fontSize: 12, color: '#9C8878' }}>No credit card · No download · Works on any device</div>
      </div>

      {/* Pain section */}
      <div style={{ background: 'white', borderTop: '0.5px solid #C8BFB5', borderBottom: '0.5px solid #C8BFB5' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '52px 24px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(22px,3vw,32px)', fontWeight: 400, color: '#1A1714', marginBottom: 32, textAlign: 'center' }}>The coordination tax of modern family life</h2>
          
              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#FEF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#E67E22" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>You're the family secretary because no one else uses the app</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>If the interface is ugly or confusing, your partner ignores it and you end up entering everything yourself.</div>
                </div>
              </div>

              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#FEF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#E67E22" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>Kids' activities, school events, and family tasks live in separate places</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>ActivityBoard, EventBoard, and TaskBoard keep everything in one place without making it feel like a work tool.</div>
                </div>
              </div>

              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#FEF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#E67E22" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>Group texts are your family's task manager</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Things get lost. No one remembers who was supposed to RSVP to the birthday party.</div>
                </div>
              </div>

              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#FEF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#E67E22" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>Sharing a calendar is different from sharing a plan</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Google Calendar shows when. Clarityboards shows what, who, and done — with a history of everything completed.</div>
                </div>
              </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 24px' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(22px,3vw,32px)', fontWeight: 400, color: '#1A1714', marginBottom: 32, textAlign: 'center' }}>What makes Clarityboards different</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          
              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="1.5"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>Boards for every part of family life</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>EventBoard for celebrations. ActivityBoard for kids' sports and activities. TaskBoard for household to-dos. Each one organized, each one shareable.</div>
              </div>

              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>Invite your partner in 30 seconds</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Type their email, pick Viewer or Contributor, send. They get a warm invite email and can start adding items immediately.</div>
              </div>

              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="1.5"><path d="M5 8h14M5 8a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2M5 8V6a2 2 0 012-2h10a2 2 0 012 2v2"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>Archive keeps the family history</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Every completed task is archived, not deleted. Who prepared for the recital, who handled the college application — it's all there.</div>
              </div>

              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>Beautiful enough to open without being asked</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Warm, editorial, calm. Not a corporate tool that feels like homework. The kind of app your family opens because it feels good.</div>
              </div>
        </div>
      </div>

      {/* Testimonial */}
      <div style={{ background: '#1A1714', padding: '52px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(18px,2.5vw,26px)', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 20 }}>"My husband added three things to the ActivityBoard on his own. Without me asking. For the first time ever. Cozi is gone — this is our family app now."</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>— Sarah, mom of 3 · Weston, FL</div>
        </div>
      </div>

      {/* Comparison */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 400, color: '#1A1714', marginBottom: 24, textAlign: 'center' }}>How it compares to Cozi</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 12, overflow: 'hidden', border: '0.5px solid #C8BFB5' }}>
            <thead>
              <tr style={{ background: '#1A1714' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Feature</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'white' }}>Clarityboards</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>Cozi</th>
              </tr>
            </thead>
            <tbody>
              
                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Modern interface</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✗ Dated design</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Contributor editing</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✓ Anyone</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Permission levels</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✓ Viewer/Editor</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✗ No control</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Completed task archive</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#A32D2D', fontWeight: '500' }}}>✗</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Full calendar free</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✗ 30-day limit</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Data export</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✗ None</td>
                  </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#FEF3E8', borderTop: '0.5px solid #E67E2230', padding: '60px 24px', textAlign: 'center' }}>
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

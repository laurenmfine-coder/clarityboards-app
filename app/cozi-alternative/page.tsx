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
          <a href="/dashboard" style={{ background: '#1B4F8A', color: 'white', padding: '7px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>Try free →</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '72px 24px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#EBF3FB', color: '#1B4F8A', fontSize: 12, fontWeight: 500, padding: '4px 14px', borderRadius: 20, marginBottom: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Free to start</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(32px,5vw,52px)', fontWeight: 400, color: '#1A1714', lineHeight: 1.15, marginBottom: 20 }}>Your family calendar shouldn't have a 30-day expiry date.</h1>
        <p style={{ fontSize: 17, color: '#6B6059', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 32px' }}>Cozi locked years of your family's history behind a paywall with one week's notice. Clarityboards gives you a full calendar, shared boards, and complete data export — always, at any tier.</p>
        <a href="/dashboard" style={{ display: 'inline-block', background: '#1A1714', color: 'white', padding: '14px 36px', borderRadius: 8, fontSize: 15, fontWeight: 500, letterSpacing: '0.01em' }}>Switch from Cozi free →</a>
        <div style={{ marginTop: 14, fontSize: 12, color: '#9C8878' }}>No credit card · No download · Works on any device</div>
      </div>

      {/* Pain section */}
      <div style={{ background: 'white', borderTop: '0.5px solid #C8BFB5', borderBottom: '0.5px solid #C8BFB5' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '52px 24px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(22px,3vw,32px)', fontWeight: 400, color: '#1A1714', marginBottom: 32, textAlign: 'center' }}>Sound familiar?</h2>
          
              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#EBF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#1B4F8A" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>Opened Cozi and saw a paywall where your calendar used to be</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Your kids' schedules, school events, sports seasons — all locked unless you pay $39/year with a week's notice.</div>
                </div>
              </div>

              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#EBF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#1B4F8A" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>Tried to get your data out and couldn't</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Cozi has no CSV export, no calendar file download. Years of family planning, held hostage.</div>
                </div>
              </div>

              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#EBF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#1B4F8A" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>Your partner ignores the app because it looks dated</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>If it doesn't feel good to open, people don't open it. Cozi's interface hasn't changed in a decade.</div>
                </div>
              </div>

              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#EBF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#1B4F8A" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>Anyone in the family can accidentally delete anything</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Cozi has no permission levels. One wrong tap by a child and a month of events is gone.</div>
                </div>
              </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 24px' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(22px,3vw,32px)', fontWeight: 400, color: '#1A1714', marginBottom: 32, textAlign: 'center' }}>What makes Clarityboards different</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          
              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#EBF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" strokeWidth="1.5"><path d="M3 4h18v16H3zM16 2v4M8 2v4M3 10h18"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>Full calendar, always</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>No 30-day limit. See your entire year — summer camp, school plays, sports seasons — on the free tier.</div>
              </div>

              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#EBF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>Real permission levels</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Viewer or contributor. No one can delete your events unless you give them permission.</div>
              </div>

              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#EBF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>Your data is always yours</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Export everything as CSV or Markdown at any time, at any plan level. No lock-in.</div>
              </div>

              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#EBF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>An interface people actually open</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Warm, calm, editorial. The kind of design that makes a partner say 'what app is that?' and actually start using it.</div>
              </div>
        </div>
      </div>

      {/* Testimonial */}
      <div style={{ background: '#1A1714', padding: '52px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(18px,2.5vw,26px)', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 20 }}>"My husband added three things to the ActivityBoard on his own without me asking. That has never happened with any app. Cozi is gone. This is our family app now."</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>— Sarah, mom of 3 · Switched from Cozi</div>
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
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Full calendar (free)</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✗ 30-day limit</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Data export</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✓ CSV + Markdown</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✗ None</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Permission levels</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✓ Viewer/Editor</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✗ Anyone can delete</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>No ads</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✗ Ad-supported free</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Board sharing</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>No bait-and-switch pricing</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#A32D2D', fontWeight: '500' }}}>✗</td>
                  </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#EBF3FB', borderTop: '0.5px solid #1B4F8A30', padding: '60px 24px', textAlign: 'center' }}>
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

'use client';
export default function LandingPage() {
  const wrapStyle = {
    fontFamily: "'DM Sans', system-ui, sans-serif" as const,
    background: '#F7F4F0' as const,
    color: '#1A1714' as const,
    minHeight: '100vh' as const,
  }
  return (
    <div style={wrapStyle}>

      {/* Nav */}
      <nav style={{ background: '#1A1714', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'white', fontSize: 20, fontWeight: 400 }}>Clarityboards</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Sign in</a>
          <a href="/dashboard" style={{ background: '#0F6E56', color: 'white', padding: '7px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>Try free →</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '72px 24px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#E1F5EE', color: '#0F6E56', fontSize: 12, fontWeight: 500, padding: '4px 14px', borderRadius: 20, marginBottom: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Free to start</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(32px,5vw,52px)', fontWeight: 400, color: '#1A1714', lineHeight: 1.15, marginBottom: 20 }}>The only planner that remembers what you've already done.</h1>
        <p style={{ fontSize: 17, color: '#6B6059', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 32px' }}>Every other app deletes your completed tasks. Clarityboards archives them — so your medication log, care history, and appointment record are always one tap away.</p>
        <a href="/dashboard" style={{ display: 'inline-block', background: '#1A1714', color: 'white', padding: '14px 36px', borderRadius: 8, fontSize: 15, fontWeight: 500, letterSpacing: '0.01em' }}>Start your care log free →</a>
        <div style={{ marginTop: 14, fontSize: 12, color: '#9C8878' }}>No credit card · No download · Works on any device</div>
      </div>

      {/* Pain section */}
      <div style={{ background: 'white', borderTop: '0.5px solid #C8BFB5', borderBottom: '0.5px solid #C8BFB5' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '52px 24px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(22px,3vw,32px)', fontWeight: 400, color: '#1A1714', marginBottom: 32, textAlign: 'center' }}>Caregiving is hard. Your tools shouldn't make it harder.</h2>
          
              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#0F6E56" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>You can't remember if you gave the 2pm medication</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Most to-do apps delete completed tasks. There's no way to look back without a paper trail.</div>
                </div>
              </div>

              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#0F6E56" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>You're coordinating care across multiple people</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Texting back and forth about who did what, when. Nothing is in one place.</div>
                </div>
              </div>

              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#0F6E56" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>Your care notes live in a different app than your tasks</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Notes in one place, reminders in another, calendar in a third. Switching between them costs you focus.</div>
                </div>
              </div>

              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#0F6E56" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>No record to show the doctor or care team</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>When a doctor asks 'how has she been this week?' — you're guessing from memory.</div>
                </div>
              </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 24px' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(22px,3vw,32px)', fontWeight: 400, color: '#1A1714', marginBottom: 32, textAlign: 'center' }}>What makes Clarityboards different</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          
              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.5"><path d="M5 8h14M5 8a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2M5 8V6a2 2 0 012-2h10a2 2 0 012 2v2M9 12h6M9 16h4"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>Archive, don't delete</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Every completed task is archived, not erased. Restore it in one tap, or browse your full care history.</div>
              </div>

              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 100 8 4 4 0 000-8z"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>Share with your care team</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Invite family members, siblings, or a professional caregiver as viewer or contributor. Everyone sees the same picture.</div>
              </div>

              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.5"><path d="M9 12h6M9 16h4M17 3H7a2 2 0 00-2 2v16l3-3 2 3 2-3 2 3 2-3 3 3V5a2 2 0 00-2-2z"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>Notes that remember context</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Markdown notes on every item — bold key instructions, bullet medication schedules, add links to care plans.</div>
              </div>

              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.5"><path d="M3 3h18v18H3zM9 9h6M9 13h6M9 17h4"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>One view for your whole care picture</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Events, tasks, and recurring items in one board. Not scattered across 4 different apps.</div>
              </div>
        </div>
      </div>

      {/* Testimonial */}
      <div style={{ background: '#1A1714', padding: '52px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(18px,2.5vw,26px)', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 20 }}>"I use the archive as a care history log. Every medication administered, every appointment attended — archived, not deleted, so we have a record. No other app does this."</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>— Rosa, pediatric nurse · Managing her mother's care</div>
        </div>
      </div>

      {/* Comparison */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 400, color: '#1A1714', marginBottom: 24, textAlign: 'center' }}>How it compares to standard to-do apps</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 12, overflow: 'hidden', border: '0.5px solid #C8BFB5' }}>
            <thead>
              <tr style={{ background: '#1A1714' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Feature</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'white' }}>Clarityboards</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>standard to-do apps</th>
              </tr>
            </thead>
            <tbody>
              
                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Completed task archive</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✗ Deleted forever</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Restore archived items</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#A32D2D', fontWeight: '500' }}}>✗</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Shared care team access</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✓ Viewer/Editor</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✗ or $$</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Markdown care notes</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✗ Plain text only</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Recurring medication reminders</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>~ Basic</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Free to start</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>~</td>
                  </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#E1F5EE', borderTop: '0.5px solid #0F6E5630', padding: '60px 24px', textAlign: 'center' }}>
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

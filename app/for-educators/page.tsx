'use client';
export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#F7F4F0', color: '#1A1714', minHeight: '100vh' }}>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'DM Sans', system-ui, sans-serif; background: #F7F4F0; color: #1A1714; -webkit-font-smoothing: antialiased; }
a { color: inherit; text-decoration: none; }
`}</style>

      {/* Nav */}
      <nav style={{ background: '#1A1714', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'white', fontSize: 20, fontWeight: 400 }}>Clarityboards</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Sign in</a>
          <a href="/dashboard" style={{ background: '#8E44AD', color: 'white', padding: '7px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>Try free →</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '72px 24px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#F5EEF8', color: '#8E44AD', fontSize: 12, fontWeight: 500, padding: '4px 14px', borderRadius: 20, marginBottom: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Free to start</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(32px,5vw,52px)', fontWeight: 400, color: '#1A1714', lineHeight: 1.15, marginBottom: 20 }}>The first digital planner that feels like a planner.</h1>
        <p style={{ fontSize: 17, color: '#6B6059', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 32px' }}>Every other productivity app looks like enterprise software. Clarityboards uses serif typography and a warm editorial palette — the kind of tool you'd actually open in front of students.</p>
        <a href="/dashboard" style={{ display: 'inline-block', background: '#1A1714', color: 'white', padding: '14px 36px', borderRadius: 8, fontSize: 15, fontWeight: 500, letterSpacing: '0.01em' }}>Start your semester board free →</a>
        <div style={{ marginTop: 14, fontSize: 12, color: '#9C8878' }}>No credit card · No download · Works on any device</div>
      </div>

      {/* Pain section */}
      <div style={{ background: 'white', borderTop: '0.5px solid #C8BFB5', borderBottom: '0.5px solid #C8BFB5' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '52px 24px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(22px,3vw,32px)', fontWeight: 400, color: '#1A1714', marginBottom: 32, textAlign: 'center' }}>Your planning tools shouldn't feel like grading more work</h2>
          
              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#F5EEF8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#8E44AD" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>Notion requires you to be a developer to use it well</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Building databases, creating linked views, learning formulas — this is not what teachers have time for at 10pm.</div>
                </div>
              </div>

              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#F5EEF8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#8E44AD" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>Your paper planner doesn't sync and your digital one feels cold</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>The warmth of a paper planner and the convenience of digital don't have to be mutually exclusive.</div>
                </div>
              </div>

              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#F5EEF8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#8E44AD" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>Professional development, lesson planning, and grading deadlines all live in different places</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>StudyBoard for your courses, WorkBoard for your department, EventBoard for professional milestones.</div>
                </div>
              </div>

              <div style={{{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}}>
                <div style={{{ width: '32px', height: '32px', borderRadius: '50%', background: '#F5EEF8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#8E44AD" strokeWidth="1.8"><path d="M13 4L6 11 3 8"/></svg>
                </div>
                <div>
                  <div style={{{ fontSize: '15px', fontWeight: '500', color: '#1A1714', marginBottom: '3px' }}}>You want to share your planning without sharing your entire system</div>
                  <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>A read-only view of your StudyBoard for a department head. A shared EventBoard for a field trip. Without giving anyone edit access to everything.</div>
                </div>
              </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 24px' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(22px,3vw,32px)', fontWeight: 400, color: '#1A1714', marginBottom: 32, textAlign: 'center' }}>What makes Clarityboards different</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          
              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#F5EEF8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E44AD" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>Works on day one — no setup</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>No databases to build, no templates to configure. Add your semester's deadlines in 5 minutes.</div>
              </div>

              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#F5EEF8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E44AD" strokeWidth="1.5"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>Serif typography that feels like your planner</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Cormorant Garamond headers. Warm cream background. The aesthetic of a quality paper planner, in a synced digital form.</div>
              </div>

              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#F5EEF8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E44AD" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>Read-only sharing for department transparency</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Share your WorkBoard or StudyBoard as view-only with a department head or colleague. They see your planning without being able to edit it.</div>
              </div>

              <div style={{{ background: 'white', border: '0.5px solid #C8BFB5', borderRadius: '12px', padding: '20px' }}}>
                <div style={{{ width: '36px', height: '36px', borderRadius: '8px', background: '#F5EEF8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E44AD" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
                </div>
                <div style={{{ fontSize: '14px', fontWeight: '500', color: '#1A1714', marginBottom: '6px' }}}>Markdown notes for lesson context</div>
                <div style={{{ fontSize: '13px', color: '#6B6059', lineHeight: '1.6' }}}>Add formatted notes to any item — bold key standards, bullet materials lists, link to resources. Renders cleanly in read mode.</div>
              </div>
        </div>
      </div>

      {/* Testimonial */}
      <div style={{ background: '#1A1714', padding: '52px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(18px,2.5vw,26px)', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 20 }}>"I retired my paper planner. I didn't think I would — I've kept one for 20 years. The serif typography is the thing. It feels like a planner, not a dashboard."</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>— Patricia, high school English teacher · 20-year paper planner convert</div>
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
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✗ Must build</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Warm editorial aesthetic</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>~ Cold minimal</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>No learning curve</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>✗ Hours of setup</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Markdown notes</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Read-only sharing</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#3B6D11', fontWeight: '500' }}}>✓</td>
                  </tr>

                  <tr style={{{ borderBottom: '0.5px solid #EDE8E2' }}}>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', color: '#1A1714', fontWeight: '500' }}}>Price</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>Free · $99/yr Pro</td>
                    <td style={{{ padding: '10px 12px', fontSize: '13px', textAlign: 'center', color: '#854F0B', fontWeight: '500' }}}>$120/yr</td>
                  </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#F5EEF8', borderTop: '0.5px solid #8E44AD30', padding: '60px 24px', textAlign: 'center' }}>
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

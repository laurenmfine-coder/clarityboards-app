'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/dashboard')
      else setChecking(false)
    })
  }, [router])

  const signInWithGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error(error)
      setLoading(false)
    }
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F7FA' }}>
      <div style={{ color: '#1B4F8A', fontFamily: 'Georgia, serif', fontSize: 18, animation: 'pulse 2s infinite' }}>
        Loading…
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F4F7FA 0%, #EBF3FB 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: 24,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 24,
        boxShadow: '0 4px 40px rgba(27,79,138,0.12)',
        padding: '48px 40px',
        width: '100%',
        maxWidth: 400,
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {[['#F5A623','#D4E6F1'],['#D4E6F1','#2E9E8F']].map((pair, r) => (
              <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {pair.map((c, i) => (
                  <div key={i} style={{ width: 11, height: 11, borderRadius: 3, background: c }} />
                ))}
              </div>
            ))}
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#1A2B3C', letterSpacing: '-0.02em' }}>
            clarity<span style={{ color: '#2874A6' }}>boards</span>
          </span>
        </div>

        <h1 style={{
          fontSize: 26, fontWeight: 800, color: '#1A2B3C',
          fontFamily: 'Georgia, serif', margin: '0 0 8px',
        }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 14, color: '#5A7A94', margin: '0 0 36px' }}>
          Sign in to access your boards
        </p>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '14px 24px',
            borderRadius: 12,
            border: '1.5px solid #E2E8F0',
            background: loading ? '#F8FAFC' : 'white',
            color: '#1A2B3C',
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC' }}
          onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'white' }}
        >
          {/* Google icon */}
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <path d="M43.6 20.5H42V20H24v8h11.3C33.6 33 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.4 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" fill="#FFC107"/>
            <path d="M6.3 14.7l6.6 4.8C14.6 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.4 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" fill="#FF3D00"/>
            <path d="M24 44c5.4 0 10.2-2 13.8-5.3l-6.4-5.4C29.3 35.3 26.8 36 24 36c-5.3 0-9.6-3-11.3-7.5l-6.6 5.1C9.5 39.6 16.2 44 24 44z" fill="#4CAF50"/>
            <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.4 5.4C37.3 39 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" fill="#1976D2"/>
          </svg>
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 24 }}>
          New to Clarityboards?{' '}
          <a href="/onboarding" style={{ color: '#2874A6', textDecoration: 'none', fontWeight: 600 }}>
            Get started free →
          </a>
        </p>
      </div>
    </div>
  )
}

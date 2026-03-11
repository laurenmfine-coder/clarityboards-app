'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const BOARD_LABELS: Record<string, string> = {
  event: 'EventBoard', study: 'StudyBoard', activity: 'ActivityBoard',
  career: 'CareerBoard', task: 'TaskBoard',
}
const BOARD_COLORS: Record<string, string> = {
  event: '#2874A6', study: '#1E8449', activity: '#E67E22',
  career: '#8E44AD', task: '#C0392B',
}

export default function AcceptInvitePage() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')

  const [share, setShare]   = useState<any>(null)
  const [status, setStatus] = useState<'loading' | 'found' | 'error' | 'accepting' | 'done'>('loading')
  const [error, setError]   = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setError('Invalid invite link.'); return }
    fetch(`/api/invite/accept?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setStatus('error'); setError(d.error) }
        else { setShare(d.share); setStatus('found') }
      })
      .catch(() => { setStatus('error'); setError('Something went wrong.') })
  }, [token])

  const handleAccept = async () => {
    setStatus('accepting')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Not signed in — redirect to login with return URL
      router.push(`/login?redirect=/invite/accept?token=${token}`)
      return
    }
    const res = await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, user_id: user.id, user_email: user.email }),
    })
    const data = await res.json()
    if (data.error) { setStatus('error'); setError(data.error) }
    else { setStatus('done') }
  }

  const boardColor  = share ? BOARD_COLORS[share.board_type] ?? '#2874A6' : '#2874A6'
  const boardLabel  = share ? BOARD_LABELS[share.board_type] ?? share.board_type : ''
  const roleLabel   = share?.role === 'editor' ? 'add and edit items' : 'view items'

  return (
    <div style={{ minHeight: '100vh', background: '#F2EFE9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Georgia, serif' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '40px 36px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.10)' }}>

        {status === 'loading' && (
          <p style={{ color: '#5A7A94', fontSize: 15 }}>Loading invite...</p>
        )}

        {status === 'found' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: boardColor + '20', border: `2px solid ${boardColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>
              📋
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A2B3C', marginBottom: 10 }}>
              You've been invited!
            </h1>
            <p style={{ color: '#5A7A94', fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>
              <strong style={{ color: '#1A2B3C' }}>{share.invited_name ?? 'Someone'}</strong>'s invite lets you{' '}
              <strong style={{ color: boardColor }}>{roleLabel}</strong> on their{' '}
              <strong style={{ color: boardColor }}>{boardLabel}</strong>.
            </p>
            <button
              onClick={handleAccept}
              style={{ marginTop: 24, width: '100%', padding: '13px', background: boardColor, color: 'white', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              Accept invitation →
            </button>
            <p style={{ marginTop: 12, fontSize: 12, color: '#9B9B9B' }}>
              You'll need a Clarityboards account to accept.
            </p>
          </>
        )}

        {status === 'accepting' && (
          <p style={{ color: '#5A7A94', fontSize: 15 }}>Activating your access...</p>
        )}

        {status === 'done' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A2B3C', marginBottom: 10 }}>You're in!</h1>
            <p style={{ color: '#5A7A94', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
              <strong style={{ color: boardColor }}>{boardLabel}</strong> is now visible on your dashboard.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              style={{ width: '100%', padding: '13px', background: '#1A2B3C', color: 'white', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              Go to dashboard →
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A2B3C', marginBottom: 10 }}>Invite not found</h1>
            <p style={{ color: '#5A7A94', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              style={{ width: '100%', padding: '13px', background: '#1A2B3C', color: 'white', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              Go to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}

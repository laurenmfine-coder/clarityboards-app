'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createBrowserClient } from '@supabase/ssr'
import { BOARDS } from '@/lib/boards'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function OnboardingPage() {
  const router = useRouter()
  const t = useTranslations('onboarding')
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const name = data.user.user_metadata?.full_name?.split(' ')[0] || ''
      setUserName(name)
    })
  }, [router])

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(b => b !== id)
        : prev.length < 2 ? [...prev, id] : prev
    )
  }

  const handleContinue = async () => {
    if (selected.length !== 2) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('items').insert({
      user_id: user.id,
      board: 'task',
      title: '__boards__' + selected.join(','),
      status: 'done',
      checklist: [],
    })
    router.push('/dashboard')
  }

  // Board detail keys must match en.json onboarding.boards.*
  const boardDetailKeys = ['event', 'study', 'activity', 'career', 'task'] as const
  const boardEmojis: Record<string, string> = {
    event: '🎉', study: '📚', activity: '⚽', career: '💼', task: '✅',
  }

  const remaining = 2 - selected.length
  const ctaLabel = saving
    ? t('ctaSaving')
    : selected.length === 2
      ? t('ctaReady')
      : remaining === 1
        ? t('ctaSelectMore', { n: 1 })
        : t('ctaSelectMorePlural', { n: remaining })

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['#F5A623','#D4E6F1'],['#D4E6F1','#2E9E8F']].map((pair, r) => (
            <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {pair.map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: c }} />)}
            </div>
          ))}
        </div>
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '1.4rem', color: '#1B4F8A' }}>Clarityboards</span>
      </div>

      <div style={{ maxWidth: 780, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.25rem', fontWeight: 'bold', color: '#1A2B3C', marginBottom: '0.75rem', lineHeight: 1.2 }}>
            {userName ? t('welcomeUser', { name: userName }) : t('welcome')}{' '}
            <em style={{ color: '#1B4F8A', fontStyle: 'italic' }}>{t('headline')}</em>
          </h1>
          <p style={{ color: '#5A7A94', fontSize: '1rem', lineHeight: 1.7 }}>
            {t('subheadline')}<br />
            <span style={{ fontSize: '0.85rem' }}>
              {t('upgradeNote')} <strong style={{ color: '#1B4F8A' }}>{t('upgradeNoteBold')}</strong>
            </span>
          </p>
        </div>

        {/* Board grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {BOARDS.map(b => {
            const isSelected = selected.includes(b.id)
            const isDisabled = !isSelected && selected.length >= 2
            const examples = t.raw(`boards.${b.id}.examples`) as string[]
            return (
              <button key={b.id} onClick={() => toggle(b.id)} disabled={isDisabled}
                style={{ border: isSelected ? `2px solid ${b.color}` : '2px solid #EBF3FB', borderRadius: 16, padding: '1.25rem 0.875rem', background: isSelected ? `${b.color}15` : 'white', cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.35 : 1, transition: 'all 0.15s', textAlign: 'left', position: 'relative' }}>
                {isSelected && (
                  <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{boardEmojis[b.id]}</div>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: 8 }}>{b.letter}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '0.9rem', color: '#1A2B3C', marginBottom: 2 }}>{b.label}</div>
                <div style={{ fontSize: '0.68rem', color: '#5A7A94', fontStyle: 'italic', marginBottom: 8 }}>
                  {t(`boards.${b.id}.who` as any)}
                </div>
                <div style={{ borderTop: '1px solid #EBF3FB', paddingTop: 7 }}>
                  {examples.map(ex => (
                    <div key={ex} style={{ fontSize: '0.67rem', color: '#5A7A94', marginBottom: 3, display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                      <span style={{ color: b.color, flexShrink: 0, marginTop: 1 }}>·</span>{ex}
                    </div>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        {/* Selection indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: '2rem' }}>
          {[0,1].map(i => {
            const board = BOARDS.find(b => b.id === selected[i])
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {board ? (
                  <>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: board.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '0.9rem' }}>{board.letter}</div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1A2B3C' }}>{board.label}</span>
                  </>
                ) : (
                  <div style={{ width: 30, height: 30, borderRadius: 8, border: '2px dashed #D4E6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4E6F1', fontSize: '1.1rem' }}>+</div>
                )}
                {i === 0 && <span style={{ color: '#D4E6F1', fontSize: '1.25rem', margin: '0 4px' }}>&</span>}
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={handleContinue} disabled={selected.length !== 2 || saving}
            style={{ background: selected.length === 2 ? '#1B4F8A' : '#D4E6F1', color: selected.length === 2 ? 'white' : '#5A7A94', border: 'none', borderRadius: 14, padding: '14px 44px', fontSize: '1rem', fontWeight: 700, cursor: selected.length === 2 ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

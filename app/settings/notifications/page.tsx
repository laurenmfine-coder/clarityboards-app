'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const T = {
  ivory:  '#F7F4F0',
  ink:    '#1A1714',
  sub:    '#6B6059',
  muted:  '#9C8878',
  border: '#C8BFB5',
  sand:   '#EDE8E2',
  accent: '#2874A6',
  sans:   "'DM Sans', system-ui, sans-serif",
  serif:  "'Cormorant Garamond', Georgia, serif",
}

const TIMING_OPTIONS = [
  { value: 10,    label: '10 minutes before' },
  { value: 15,    label: '15 minutes before' },
  { value: 30,    label: '30 minutes before' },
  { value: 60,    label: '1 hour before' },
  { value: 120,   label: '2 hours before' },
  { value: 360,   label: '6 hours before' },
  { value: 1440,  label: '1 day before' },
  { value: 2880,  label: '2 days before' },
  { value: 10080, label: '1 week before' },
]

const CHANNEL_OPTIONS = [
  { value: 'email', label: 'Email only' },
  { value: 'sms',   label: 'SMS only' },
  { value: 'both',  label: 'Email + SMS' },
]

type Prefs = {
  reminder_enabled:      boolean
  reminder_channel:      string
  reminder_default_mins: number
  reminder_phone:        string
  quiet_hours_enabled:   boolean
  quiet_start:           string
  quiet_end:             string
  digest_enabled:        boolean
  digest_time:           string
}

const DEFAULT_PREFS: Prefs = {
  reminder_enabled:      false,
  reminder_channel:      'email',
  reminder_default_mins: 60,
  reminder_phone:        '',
  quiet_hours_enabled:   false,
  quiet_start:           '22:00',
  quiet_end:             '07:00',
  digest_enabled:        false,
  digest_time:           '07:00',
}

export default function NotificationsPage() {
  const router = useRouter()
  const [prefs,      setPrefs]      = useState<Prefs>(DEFAULT_PREFS)
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [userId,     setUserId]     = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState('')

  const loadPrefs = useCallback(async (uid: string) => {
    const { data } = await supabase.from('notification_prefs').select('*').eq('user_id', uid).single()
    if (data) setPrefs({ ...DEFAULT_PREFS, ...data, reminder_phone: data.reminder_phone ?? '' })
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/'); return }
      setUserId(data.user.id)
      loadPrefs(data.user.id)
    })
  }, [loadPrefs, router])

  const set = (key: keyof Prefs, val: any) => { setPrefs(p => ({ ...p, [key]: val })); setSaved(false) }

  const save = async () => {
    if (!userId) return
    if (prefs.reminder_phone && !/^\+[1-9]\d{7,14}$/.test(prefs.reminder_phone)) {
      setPhoneError('Enter phone in E.164 format: +15551234567'); return
    }
    setPhoneError(''); setSaving(true)
    await supabase.from('notification_prefs').upsert({
      user_id:               userId,
      reminder_enabled:      prefs.reminder_enabled,
      reminder_channel:      prefs.reminder_channel,
      reminder_default_mins: prefs.reminder_default_mins,
      reminder_phone:        prefs.reminder_phone || null,
      quiet_hours_enabled:   prefs.quiet_hours_enabled,
      quiet_start:           prefs.quiet_start,
      quiet_end:             prefs.quiet_end,
      digest_enabled:        prefs.digest_enabled,
      digest_time:           prefs.digest_time,
      updated_at:            new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div style={{ minHeight: '100vh', background: '#F7F4F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif", color: '#9C8878', fontSize: 14 }}>Loading…</div>

  const needsPhone = prefs.reminder_channel === 'sms' || prefs.reminder_channel === 'both'
  const sel: React.CSSProperties = { padding: '7px 10px', borderRadius: 8, border: '1px solid #C8BFB5', background: '#F7F4F0', fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: '#1A1714', cursor: 'pointer', outline: 'none' }
  const inp: React.CSSProperties = { ...sel, width: '100%' }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4F0', fontFamily: "'DM Sans',system-ui,sans-serif", color: '#1A1714' }}>
      <nav style={{ background: '#1A1714', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans',sans-serif", padding: 0 }}>← Dashboard</button>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>·</span>
        <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: 400 }}>Notifications</span>
      </nav>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, fontWeight: 400, color: '#1A1714', marginBottom: 6 }}>Notification Settings</h1>
        <p style={{ fontSize: 13, color: '#6B6059', marginBottom: 32, lineHeight: 1.6 }}>Set your default reminder preferences. Override these on any individual item.</p>

        <Card title="Reminders" sub="Get notified before events and due dates">
          <Row label="Enable reminders"><Toggle value={prefs.reminder_enabled} onChange={v => set('reminder_enabled', v)} /></Row>
          {prefs.reminder_enabled && (<>
            <Row label="Default timing" sub="How long before an event to notify you">
              <select value={prefs.reminder_default_mins} onChange={e => set('reminder_default_mins', Number(e.target.value))} style={sel}>
                {TIMING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Row>
            <Row label="Channel">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CHANNEL_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => set('reminder_channel', o.value)}
                    style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer', border: '1px solid ' + (prefs.reminder_channel === o.value ? '#2874A6' : '#C8BFB5'), background: prefs.reminder_channel === o.value ? '#2874A6' : 'transparent', color: prefs.reminder_channel === o.value ? 'white' : '#6B6059', transition: 'all 0.15s' }}>
                    {o.label}
                  </button>
                ))}
              </div>
            </Row>
            {needsPhone && (
              <Row label="Phone number" sub="Include country code: +15551234567">
                <input type="tel" value={prefs.reminder_phone} onChange={e => { set('reminder_phone', e.target.value); setPhoneError('') }} placeholder="+15551234567" style={{ ...inp, borderColor: phoneError ? '#C0392B' : '#C8BFB5' }} />
                {phoneError && <div style={{ fontSize: 11, color: '#C0392B', marginTop: 4 }}>{phoneError}</div>}
              </Row>
            )}
          </>)}
        </Card>

        <Card title="Quiet Hours" sub="No reminders will be sent during this window">
          <Row label="Enable quiet hours"><Toggle value={prefs.quiet_hours_enabled} onChange={v => set('quiet_hours_enabled', v)} /></Row>
          {prefs.quiet_hours_enabled && (
            <Row label="Window">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="time" value={prefs.quiet_start} onChange={e => set('quiet_start', e.target.value)} style={{ ...sel, width: 'auto' }} />
                <span style={{ fontSize: 13, color: '#6B6059' }}>to</span>
                <input type="time" value={prefs.quiet_end} onChange={e => set('quiet_end', e.target.value)} style={{ ...sel, width: 'auto' }} />
              </div>
              <div style={{ fontSize: 11, color: '#9C8878', marginTop: 6 }}>Overnight ranges work — e.g. 10:00 PM to 7:00 AM</div>
            </Row>
          )}
        </Card>

        <Card title="Daily Digest" sub="Morning summary of what's due today">
          <Row label="Send daily digest email"><Toggle value={prefs.digest_enabled} onChange={v => set('digest_enabled', v)} /></Row>
          {prefs.digest_enabled && (
            <Row label="Digest time">
              <input type="time" value={prefs.digest_time} onChange={e => set('digest_time', e.target.value)} style={{ ...sel, width: 'auto' }} />
            </Row>
          )}
        </Card>

        <button onClick={save} disabled={saving}
          style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: saved ? '#2D7D52' : '#1A1714', color: 'white', fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans',sans-serif", cursor: saving ? 'default' : 'pointer', transition: 'background 0.3s', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save preferences'}
        </button>
        <p style={{ fontSize: 11, color: '#9C8878', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>Override these defaults on any individual item from the item detail view.</p>
      </div>
    </div>
  )
}

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20, background: 'white', borderRadius: 12, border: '0.5px solid #C8BFB5', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px 10px', borderBottom: '0.5px solid #EDE8E2' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1714', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11, color: '#9C8878' }}>{sub}</div>
      </div>
      <div style={{ padding: '4px 0' }}>{children}</div>
    </div>
  )
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '10px 16px', borderBottom: '0.5px solid #EDE8E2', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: '#1A1714' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#9C8878', marginTop: 2, lineHeight: 1.5 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>{children}</div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: value ? '#2874A6' : '#C8BFB5', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: value ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  )
}

'use client'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Phone, ArrowLeft, Check, AlertCircle, MessageSquare } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function PhoneSettingsPage() {
  const router = useRouter()
  const t = useTranslations('settingsPhone')
  const [userId, setUserId]   = useState<string | null>(null)
  const [phone, setPhone]     = useState('')
  const [current, setCurrent] = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [status, setStatus]   = useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/'); return }
      setUserId(data.user.id)
      // Load existing phone from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('user_id', data.user.id)
        .single()
      if (profile?.phone) {
        setCurrent(profile.phone)
        setPhone(profile.phone)
      }
    })
  }, [router])

  const formatPhone = (val: string) => {
    // Strip everything except digits and leading +
    const digits = val.replace(/[^\d+]/g, '')
    return digits
  }

  const handleSave = async () => {
    if (!userId) return
    const cleaned = formatPhone(phone).trim()

    // Basic validation — must be E.164 style or 10 digits
    const e164 = /^\+1\d{10}$|^\+\d{10,15}$/
    const tenDigit = /^\d{10}$/
    let normalized = cleaned
    if (tenDigit.test(cleaned)) normalized = '+1' + cleaned
    if (!e164.test(normalized)) {
      setErrorMsg(t('errorInvalid'))
      setStatus('error')
      return
    }

    setSaving(true)
    setStatus('idle')
    setErrorMsg('')

    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: userId, phone: normalized }, { onConflict: 'user_id' })

    setSaving(false)
    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
    } else {
      setCurrent(normalized)
      setPhone(normalized)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const handleRemove = async () => {
    if (!userId) return
    setSaving(true)
    await supabase.from('profiles').upsert({ user_id: userId, phone: null }, { onConflict: 'user_id' })
    setCurrent(null)
    setPhone('')
    setSaving(false)
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      <div className="max-w-lg mx-auto px-4 py-10">

        {/* Back */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm text-[#5A7A94] hover:text-[#1A2B3C] mb-8 transition-colors"
        >
          <ArrowLeft size={15} /> {t('back')}
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#1B4F8A] flex items-center justify-center flex-shrink-0">
            <Phone size={20} color="white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A2B3C]" style={{ fontFamily: 'Georgia, serif' }}>
              {t('title')}
            </h1>
            <p className="text-sm text-[#5A7A94]">{t('subtitle')}</p>
          </div>
        </div>

        {/* {t('howItWorksTitle')} */}
        <div className="bg-white rounded-2xl border border-[#EBF3FB] p-5 mb-5">
          <div className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide mb-3">{t('howItWorksTitle')}</div>
          <div className="space-y-3">
            {[
              { icon: <MessageSquare size={15} className="text-[#1B4F8A]" />, text: 'Text your Clarityboards number: +1 (877) 318-9322' },
              { icon: '🤖', text: 'AI reads your message and adds it to the right board automatically' },
              { icon: '📅', text: 'Dates, times, checklists, urgency — all parsed from natural language' },
              { icon: '✏️', text: 'Try: "Soccer game Friday 4pm" or "Pick up: milk, eggs, bread"' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="flex-shrink-0 mt-0.5">
                  {typeof item.icon === 'string' ? item.icon : item.icon}
                </span>
                <span className="text-[#5A7A94]">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Phone input */}
        <div className="bg-white rounded-2xl border border-[#EBF3FB] p-5 mb-5">
          <div className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide mb-4">{t('yourNumberTitle')}</div>

          {current && (
            <div className="flex items-center gap-2 bg-[#EAFAF1] border border-[#27AE60]/20 rounded-xl px-4 py-3 mb-4">
              <Check size={15} className="text-[#27AE60] flex-shrink-0" />
              <span className="text-sm font-medium text-[#1A2B3C]">{current}</span>
              <span className="text-xs text-[#27AE60] ml-auto font-medium">Active</span>
            </div>
          )}

          <div className="mb-4">
            <label className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide mb-1.5 block">
              {t('label')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setStatus('idle') }}
              placeholder={t('placeholder')}
              className="w-full border border-[#D4E6F1] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30"
            />
            <p className="text-xs text-[#5A7A94] mt-1.5">
              {t('hint')}
            </p>
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">
              <AlertCircle size={14} className="flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          {status === 'saved' && (
            <div className="flex items-center gap-2 text-sm text-[#27AE60] bg-[#EAFAF1] rounded-xl px-4 py-3 mb-4">
              <Check size={14} className="flex-shrink-0" />
              {current ? t('savedPhone') : t('removedPhone')}
            </div>
          )}

          <div className="flex gap-3">
            {current && (
              <button
                onClick={handleRemove}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Remove
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !phone.trim()}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: '#1B4F8A' }}
            >
              {saving ? t('saving') : current ? t('update') : t('save')}
            </button>
          </div>
        </div>

        {/* Twilio note */}
        <div className="bg-[#FFF8F0] rounded-2xl border border-[#F5A623]/20 p-4 text-sm text-[#5A7A94]">
          <span className="font-semibold text-[#F5A623]">{t('twilioTitle')}</span>
          <p className="mt-1">
            {t('twilioBody')}
          </p>
        </div>

      </div>
    </div>
  )
}

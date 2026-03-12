'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BOARDS, BOARD_MAP } from '@/lib/boards'
import { ArrowLeft, Plus, Trash2, RefreshCw, Check, X, ExternalLink, Loader2 } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
type Subscription = {
  id: string
  url: string
  label: string | null
  default_board: string | null
  last_synced: string | null
  created_at: string
}

type SyncResult = {
  sub_id: string
  label: string
  imported: number
  skipped: number
  error?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const EXAMPLE_URLS = [
  { label: 'TeamSnap team',       hint: 'From TeamSnap → My Team → Sharing → iCal link' },
  { label: 'School district',     hint: 'From your school district website → Calendar → Subscribe' },
  { label: 'Google Calendar',     hint: 'Google Calendar → ⋮ → Settings → Integrate calendar → Secret address in iCal format' },
  { label: 'Canvas / school LMS', hint: 'Canvas → Calendar → Calendar Feed (bottom right of calendar page)' },
  { label: 'Sports league',       hint: 'Any .ics URL from a sports league, rec center, or activity provider' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ICalSubscriptionsPage() {
  const router = useRouter()
  const [userId,  setUserId]  = useState<string | null>(null)
  const [subs,    setSubs]    = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  // Add form state
  const [showAdd,    setShowAdd]    = useState(false)
  const [newUrl,     setNewUrl]     = useState('')
  const [newLabel,   setNewLabel]   = useState('')
  const [newBoard,   setNewBoard]   = useState('auto')
  const [addError,   setAddError]   = useState('')
  const [adding,     setAdding]     = useState(false)

  // Sync state
  const [syncing,      setSyncing]      = useState<string | null>(null) // sub id
  const [syncResults,  setSyncResults]  = useState<Record<string, SyncResult>>({})
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null)

  // ── Load subscriptions ──────────────────────────────────────────────────────
  const load = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('ical_subscriptions')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: true })
    setSubs((data ?? []) as Subscription[])
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      setUserId(user.id)
      load(user.id)
    })
  }, [load, router])

  // ── Add subscription ────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!userId || !newUrl.trim()) return
    setAddError('')
    setAdding(true)

    // Basic URL validation
    try { new URL(newUrl.trim()) } catch {
      setAddError('Please enter a valid URL starting with https://')
      setAdding(false)
      return
    }
    if (!newUrl.trim().toLowerCase().includes('ical') && !newUrl.trim().toLowerCase().endsWith('.ics') && !newUrl.trim().includes('webcal')) {
      // Soft warning but still allow
    }

    const { data, error } = await supabase
      .from('ical_subscriptions')
      .insert({
        user_id:       userId,
        url:           newUrl.trim().replace(/^webcal:\/\//, 'https://'),
        label:         newLabel.trim() || null,
        default_board: newBoard === 'auto' ? null : newBoard,
      })
      .select()
      .single()

    setAdding(false)

    if (error) {
      setAddError(error.message)
      return
    }

    setSubs(prev => [...prev, data as Subscription])
    setNewUrl('')
    setNewLabel('')
    setNewBoard('auto')
    setShowAdd(false)

    // Auto-trigger first sync
    await triggerSync((data as Subscription).id)
  }

  // ── Trigger sync for one subscription ──────────────────────────────────────
  const triggerSync = async (subId: string) => {
    setSyncing(subId)
    try {
      const res = await fetch('/api/ical-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: subId }),
      })
      const data = await res.json()
      const result: SyncResult = data.results?.[0] ?? { sub_id: subId, label: '', imported: 0, skipped: 0, error: data.error }
      setSyncResults(prev => ({ ...prev, [subId]: result }))
      // Refresh sub list (to get updated last_synced)
      if (userId) load(userId)
    } catch (err: any) {
      setSyncResults(prev => ({ ...prev, [subId]: { sub_id: subId, label: '', imported: 0, skipped: 0, error: err.message } }))
    } finally {
      setSyncing(null)
    }
  }

  // ── Remove subscription ─────────────────────────────────────────────────────
  const handleRemove = async (subId: string) => {
    await supabase.from('ical_subscriptions').delete().eq('id', subId)
    // Note: imported items are NOT deleted — they stay in the user's boards
    setSubs(prev => prev.filter(s => s.id !== subId))
    setRemoveConfirm(null)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA]">
      <Loader2 className="animate-spin text-[#2874A6]" size={32} />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F4F7FA]" style={{ fontFamily: 'Georgia, serif' }}>

      {/* Header */}
      <div className="bg-[#1A2B3C] px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="text-[#5A7A94] hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-white font-bold text-lg">Subscribe to Calendars</h1>
          <p className="text-[#5A7A94] text-xs">Import events from TeamSnap, school calendars, Canvas, and more</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="ml-auto bg-[#2874A6] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#1f5f8a] transition-colors flex items-center gap-2"
        >
          <Plus size={14} /> Add calendar
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* How it works */}
        <div className="bg-[#EBF3FB] rounded-xl px-5 py-4 border border-[#AED6F1]">
          <div className="font-bold text-sm text-[#1B4F8A] mb-3">How calendar subscriptions work</div>
          <div className="space-y-2">
            {[
              ['📅', 'Paste any .ics URL — TeamSnap, school calendars, Canvas, sports leagues, Google Calendar, and more'],
              ['🔄', 'Events auto-import every 6 hours. Use the ↺ button to sync immediately'],
              ['🎯', 'Clarityboards auto-sorts events to the right board (soccer → ActivityBoard, homework → StudyBoard)'],
              ['🔒', 'Your subscription URL is private and stored securely. Events already imported stay even if you remove the subscription'],
            ].map(([icon, text]) => (
              <div key={icon as string} className="flex gap-3 items-start">
                <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>
                <span className="text-xs text-[#2C5F8A] leading-relaxed">{text as string}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription list */}
        {subs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E2D9] px-6 py-12 text-center">
            <div className="text-4xl mb-3">📅</div>
            <div className="font-semibold text-[#1A2B3C] mb-1">No calendar subscriptions yet</div>
            <div className="text-sm text-[#9B8E7E] mb-5">Add a TeamSnap link, Canvas feed, or any .ics URL to get started</div>
            <button
              onClick={() => setShowAdd(true)}
              className="px-5 py-2.5 rounded-xl bg-[#2874A6] text-white text-sm font-semibold hover:bg-[#1f5f8a] transition-colors"
            >
              Add your first calendar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {subs.map(sub => {
              const result    = syncResults[sub.id]
              const isSyncing = syncing === sub.id
              const boardCfg  = sub.default_board ? BOARD_MAP[sub.default_board as keyof typeof BOARD_MAP] : null

              return (
                <div key={sub.id} className="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden">
                  <div className="px-5 py-4 flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-[#EBF3FB] flex items-center justify-center flex-shrink-0 text-lg">
                      📅
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Label + board pill */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[#1A2B3C]">
                          {sub.label ?? 'Unnamed calendar'}
                        </span>
                        {boardCfg ? (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                            style={{ background: boardCfg.color }}
                          >
                            {boardCfg.label}
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#F4F7FA] text-[#5A7A94]">
                            Auto-detect board
                          </span>
                        )}
                      </div>

                      {/* URL */}
                      <div className="text-xs text-[#9B8E7E] font-mono truncate mt-0.5">{sub.url}</div>

                      {/* Last synced */}
                      <div className="text-xs text-[#9B8E7E] mt-1">
                        {sub.last_synced
                          ? `Last synced ${timeAgo(sub.last_synced)}`
                          : 'Never synced'}
                      </div>

                      {/* Sync result */}
                      {result && (
                        <div className={`mt-2 text-xs font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 ${
                          result.error
                            ? 'bg-red-50 text-red-600'
                            : result.imported > 0
                              ? 'bg-green-50 text-green-700'
                              : 'bg-[#F4F7FA] text-[#5A7A94]'
                        }`}>
                          {result.error ? (
                            <><X size={11} /> Error: {result.error}</>
                          ) : result.imported > 0 ? (
                            <><Check size={11} /> {result.imported} new event{result.imported !== 1 ? 's' : ''} imported</>
                          ) : (
                            <>Already up to date</>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => triggerSync(sub.id)}
                        disabled={isSyncing}
                        title="Sync now"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5A7A94] hover:text-[#2874A6] hover:bg-[#EBF3FB] transition-all disabled:opacity-40"
                      >
                        <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                      </button>
                      {removeConfirm === sub.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleRemove(sub.id)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => setRemoveConfirm(null)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-[#F5F2EC] text-[#7A6E62] border border-[#E8E2D9]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRemoveConfirm(sub.id)}
                          title="Remove subscription"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#C4B9AA] hover:text-red-400 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Example sources */}
        <div className="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#F0ECE4] bg-[#FAFAF8]">
            <span className="text-xs font-bold text-[#9B8E7E] uppercase tracking-wider">Where to find .ics URLs</span>
          </div>
          {EXAMPLE_URLS.map((ex, i) => (
            <div key={i} className="px-5 py-3 border-b border-[#F5F2EC] last:border-0 flex items-start gap-3">
              <span className="text-lg flex-shrink-0 mt-0.5">📋</span>
              <div>
                <div className="font-semibold text-sm text-[#1A2B3C]">{ex.label}</div>
                <div className="text-xs text-[#9B8E7E] mt-0.5">{ex.hint}</div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Add modal */}
      {showAdd && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowAdd(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1A2B3C]">Add calendar subscription</h2>
              <button onClick={() => setShowAdd(false)} className="text-[#9B8E7E] hover:text-[#1A2B3C] text-2xl leading-none">×</button>
            </div>

            {/* URL */}
            <div>
              <label className="text-xs font-bold text-[#9B8E7E] uppercase tracking-wider block mb-2">Calendar URL (.ics or webcal://)</label>
              <input
                autoFocus
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://…/calendar.ics"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D9] text-sm text-[#1A2B3C] focus:outline-none focus:border-[#2874A6] font-mono"
              />
              <p className="text-xs text-[#9B8E7E] mt-1">TeamSnap, Canvas, Google Calendar, school district, sports leagues, etc.</p>
            </div>

            {/* Label */}
            <div>
              <label className="text-xs font-bold text-[#9B8E7E] uppercase tracking-wider block mb-2">Label (optional)</label>
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. Jake soccer, Lincoln Elementary"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D9] text-sm text-[#1A2B3C] focus:outline-none focus:border-[#2874A6]"
              />
            </div>

            {/* Board override */}
            <div>
              <label className="text-xs font-bold text-[#9B8E7E] uppercase tracking-wider block mb-2">Import events to</label>
              <select
                value={newBoard}
                onChange={e => setNewBoard(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D9] text-sm text-[#1A2B3C] focus:outline-none focus:border-[#2874A6]"
              >
                <option value="auto">Auto-detect (recommended)</option>
                {BOARDS.map(b => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
              <p className="text-xs text-[#9B8E7E] mt-1">Auto-detect routes soccer → ActivityBoard, assignments → StudyBoard, etc.</p>
            </div>

            {addError && <p className="text-red-500 text-xs">{addError}</p>}

            <button
              onClick={handleAdd}
              disabled={adding || !newUrl.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: '#1A2B3C' }}
            >
              {adding ? <><Loader2 size={16} className="animate-spin" /> Adding…</> : 'Add & sync now →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

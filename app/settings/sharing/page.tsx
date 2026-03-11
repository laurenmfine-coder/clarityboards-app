'use client'
export const dynamic = 'force-dynamic'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BOARD_MAP, BOARDS } from '@/lib/boards'
import { ArrowLeft, X, Check, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Share = {
  id: string
  board_type: string
  shared_user_id: string | null
  invited_email: string | null
  invited_phone: string | null
  invited_name: string | null
  role: 'editor' | 'viewer'
  status: 'pending' | 'active' | 'revoked'
  created_at: string
}

type SharedWithMe = {
  id: string
  board_type: string
  owner_id: string
  role: 'editor' | 'viewer'
  invited_name: string | null
  owner_email?: string
}

export default function SharingPage() {
  const router = useRouter()
  const t = useTranslations('settingsSharing')
  const [userId, setUserId]           = useState<string | null>(null)
  const [shares, setShares]           = useState<Share[]>([])
  const [sharedWithMe, setSharedWithMe] = useState<SharedWithMe[]>([])
  const [loading, setLoading]         = useState(true)
  const [showInvite, setShowInvite]   = useState(false)
  const [inviteBoard, setInviteBoard] = useState('activity')
  const [inviteRole, setInviteRole]   = useState<'editor' | 'viewer'>('editor')
  const [inviteMethod, setInviteMethod] = useState<'email' | 'sms'>('email')
  const [inviteValue, setInviteValue] = useState('')
  const [inviteName, setInviteName]   = useState('')
  const [inviting, setInviting]       = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [removeId, setRemoveId]       = useState<string | null>(null)

  const load = useCallback(async (uid: string) => {
    // My outgoing shares
    const { data: myShares } = await supabase
      .from('board_shares')
      .select('*')
      .eq('owner_id', uid)
      .neq('status', 'revoked')
      .order('created_at', { ascending: false })

    // Boards shared with me
    const { data: inbound } = await supabase
      .from('board_shares')
      .select('*')
      .eq('shared_user_id', uid)
      .eq('status', 'active')

    setShares((myShares as Share[]) ?? [])
    setSharedWithMe((inbound as SharedWithMe[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      setUserId(user.id)
      load(user.id)
    })
  }, [load, router])

  const handleInvite = async () => {
    if (!userId || !inviteValue.trim() || !inviteName.trim()) return
    setInviting(true)
    setInviteError('')
    setInviteSuccess('')

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_id: userId,
        board_type: inviteBoard,
        invited_name: inviteName.trim(),
        invite_method: inviteMethod,
        invite_value: inviteValue.trim(),
        role: inviteRole,
      }),
    })
    const data = await res.json()
    setInviting(false)

    if (data.error) {
      setInviteError(data.error)
    } else {
      setInviteSuccess(`Invite sent to ${inviteValue.trim()}!`)
      setInviteValue('')
      setInviteName('')
      setShowInvite(false)
      load(userId)
    }
  }

  const handleRoleChange = async (shareId: string, role: 'editor' | 'viewer') => {
    await supabase.from('board_shares').update({ role }).eq('id', shareId)
    setShares(prev => prev.map(s => s.id === shareId ? { ...s, role } : s))
  }

  const handleRemove = async (shareId: string) => {
    await supabase.from('board_shares').update({ status: 'revoked' }).eq('id', shareId)
    setShares(prev => prev.filter(s => s.id !== shareId))
    setRemoveId(null)
  }

  const groupedShares = BOARDS.reduce((acc, b) => {
    acc[b.id] = shares.filter(s => s.board_type === b.id)
    return acc
  }, {} as Record<string, Share[]>)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2EFE9]">
      <Loader2 className="animate-spin text-[#2874A6]" size={32} />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F2EFE9]" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Header */}
      <div className="bg-[#1A2B3C] px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="text-[#5A7A94] hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-white font-bold text-lg">Board Sharing</h1>
          <p className="text-[#5A7A94] text-xs">Share boards with family, friends, or colleagues</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="ml-auto bg-[#2874A6] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#1f5f8a] transition-colors flex items-center gap-2"
        >
          + Invite someone
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* Success banner */}
        {inviteSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <Check size={16} className="text-green-600" />
            <span className="text-green-700 text-sm font-medium">{inviteSuccess}</span>
            <button onClick={() => setInviteSuccess('')} className="ml-auto text-green-400 hover:text-green-600"><X size={14} /></button>
          </div>
        )}

        {/* Shared with me */}
        {sharedWithMe.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#F0ECE4] bg-[#FAFAF8]">
              <span className="text-xs font-bold text-[#9B8E7E] uppercase tracking-wider">Shared with you</span>
            </div>
            {sharedWithMe.map(s => {
              const cfg = BOARD_MAP[s.board_type as keyof typeof BOARD_MAP]
              return (
                <div key={s.id} className="px-5 py-3 flex items-center gap-3 border-b border-[#F5F2EC] last:border-0">
                  <span className="inline-flex items-center justify-center rounded-lg font-bold flex-shrink-0 text-white text-sm"
                    style={{ width: 32, height: 32, background: cfg?.color }}>
                    {cfg?.letter}
                  </span>
                  <div className="flex-1">
                    <span className="font-semibold text-sm text-[#1A2B3C]">{cfg?.label}</span>
                    <span className="text-xs text-[#9B8E7E] ml-2">shared by {s.invited_name ?? 'someone'}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.role === 'editor' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                    {s.role === 'editor' ? 'Can edit' : 'View only'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* My boards */}
        <div className="text-xs font-bold text-[#9B8E7E] uppercase tracking-wider px-1">Your boards</div>

        {BOARDS.map(b => {
          const cfg = BOARD_MAP[b.id as keyof typeof BOARD_MAP]
          const boardShares = groupedShares[b.id] ?? []
          return (
            <div key={b.id} className="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden">
              {/* Board header */}
              <div className="px-5 py-3 flex items-center gap-3 border-b border-[#F0ECE4]" style={{ background: cfg?.color + '10' }}>
                <span className="inline-flex items-center justify-center rounded-lg font-bold text-white text-sm flex-shrink-0"
                  style={{ width: 32, height: 32, background: cfg?.color }}>
                  {cfg?.letter}
                </span>
                <span className="font-bold text-[#1A2B3C] flex-1">{cfg?.label}</span>
                {boardShares.length === 0
                  ? <span className="text-xs text-[#B0A898]">Not shared</span>
                  : <span className="text-xs font-semibold" style={{ color: cfg?.color }}>{boardShares.length} {boardShares.length === 1 ? 'person' : 'people'}</span>
                }
                <button
                  onClick={() => { setInviteBoard(b.id); setShowInvite(true) }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: cfg?.color + '18', color: cfg?.color, border: `1px solid ${cfg?.color}30` }}
                >
                  + Share
                </button>
              </div>

              {/* Share rows */}
              {boardShares.map(s => (
                <div key={s.id} className="px-5 py-3 flex items-center gap-3 border-b border-[#F5F2EC] last:border-0">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: cfg?.color + '20', color: cfg?.color, border: `2px solid ${cfg?.color}40` }}>
                    {(s.invited_name ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[#1A2B3C]">{s.invited_name ?? 'Unknown'}</div>
                    <div className="text-xs text-[#9B8E7E] truncate">{s.invited_email ?? s.invited_phone ?? ''}</div>
                  </div>

                  {/* Role selector */}
                  <select
                    value={s.role}
                    onChange={e => handleRoleChange(s.id, e.target.value as 'editor' | 'viewer')}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer"
                    style={{
                      color: s.role === 'editor' ? '#1E8449' : '#2874A6',
                      background: s.role === 'editor' ? '#EAFAF1' : '#EBF5FB',
                      borderColor: s.role === 'editor' ? '#A9DFBF' : '#AED6F1',
                    }}
                  >
                    <option value="editor">Can edit</option>
                    <option value="viewer">View only</option>
                  </select>

                  {/* Status */}
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-green-500' : 'bg-orange-400'}`} />
                    <span className={`text-xs font-medium ${s.status === 'active' ? 'text-green-600' : 'text-orange-500'}`}>
                      {s.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </div>

                  {/* Remove */}
                  {removeId === s.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleRemove(s.id)} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100">Remove</button>
                      <button onClick={() => setRemoveId(null)} className="text-xs px-2.5 py-1 rounded-lg bg-[#F5F2EC] text-[#7A6E62] border border-[#E8E2D9]">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setRemoveId(s.id)} className="text-[#C4B9AA] hover:text-red-400 transition-colors text-lg leading-none">×</button>
                  )}
                </div>
              ))}
            </div>
          )
        })}

        {/* How it works */}
        <div className="bg-[#EBF3FB] rounded-xl px-5 py-4 border border-[#AED6F1] mt-2">
          <div className="font-bold text-sm text-[#1B4F8A] mb-3">How sharing works</div>
          <div className="space-y-2">
            {[
              ['📧 / 📱', 'Invite via email or SMS — they get a link to join and see your board instantly'],
              ['✏️ Can edit', 'They can add, complete, and update items. Their phone also unlocks SMS-to-board.'],
              ['👁 View only', 'They can see the board and export to calendar — no editing'],
              ['🔒 Per board', 'Sharing one board never shares the others'],
            ].map(([icon, text]) => (
              <div key={icon} className="flex gap-3 items-start">
                <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>
                <span className="text-xs text-[#2C5F8A] leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowInvite(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1A2B3C]" style={{ fontFamily: 'Georgia, serif' }}>Invite someone</h2>
              <button onClick={() => setShowInvite(false)} className="text-[#9B8E7E] hover:text-[#1A2B3C] text-2xl leading-none">×</button>
            </div>

            {/* Board picker */}
            <div>
              <label className="text-xs font-bold text-[#9B8E7E] uppercase tracking-wider block mb-2">Board</label>
              <div className="flex flex-wrap gap-2">
                {BOARDS.map(b => {
                  const cfg = BOARD_MAP[b.id as keyof typeof BOARD_MAP]
                  return (
                    <button key={b.id} onClick={() => setInviteBoard(b.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all"
                      style={{
                        borderColor: inviteBoard === b.id ? cfg?.color : '#E8E2D9',
                        background: inviteBoard === b.id ? cfg?.color + '15' : 'white',
                        color: inviteBoard === b.id ? cfg?.color : '#7A6E62',
                      }}>
                      {cfg?.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Role picker */}
            <div>
              <label className="text-xs font-bold text-[#9B8E7E] uppercase tracking-wider block mb-2">Access level</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'editor', label: 'Can edit', desc: 'Add, complete & update items', icon: '✏️' },
                  { value: 'viewer', label: 'View only', desc: 'See board, export to calendar', icon: '👁' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setInviteRole(opt.value as 'editor' | 'viewer')}
                    className="p-3 rounded-xl text-left border-2 transition-all"
                    style={{
                      borderColor: inviteRole === opt.value ? (opt.value === 'editor' ? '#1E8449' : '#2874A6') : '#E8E2D9',
                      background: inviteRole === opt.value ? (opt.value === 'editor' ? '#EAFAF1' : '#EBF5FB') : 'white',
                    }}>
                    <div className="text-lg mb-1">{opt.icon}</div>
                    <div className="font-bold text-sm text-[#1A2B3C]">{opt.label}</div>
                    <div className="text-xs text-[#9B8E7E] mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-bold text-[#9B8E7E] uppercase tracking-wider block mb-2">Their name</label>
              <input value={inviteName} onChange={e => setInviteName(e.target.value)}
                placeholder="e.g. Mike"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D9] text-sm text-[#1A2B3C] focus:outline-none focus:border-[#2874A6]" />
            </div>

            {/* Invite method */}
            <div>
              <label className="text-xs font-bold text-[#9B8E7E] uppercase tracking-wider block mb-2">Invite via</label>
              <div className="flex bg-[#F5F2EC] rounded-xl p-1 mb-3">
                {[['email', '📧 Email'], ['sms', '📱 Text']].map(([val, label]) => (
                  <button key={val} onClick={() => setInviteMethod(val as 'email' | 'sms')}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: inviteMethod === val ? 'white' : 'transparent',
                      color: inviteMethod === val ? '#1A2B3C' : '#9B8E7E',
                      boxShadow: inviteMethod === val ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
              <input value={inviteValue} onChange={e => setInviteValue(e.target.value)}
                placeholder={inviteMethod === 'email' ? 'their@email.com' : '+1 (555) 000-0000'}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D9] text-sm text-[#1A2B3C] focus:outline-none focus:border-[#2874A6]" />
            </div>

            {inviteError && <p className="text-red-500 text-xs">{inviteError}</p>}

            <button
              onClick={handleInvite}
              disabled={inviting || !inviteValue.trim() || !inviteName.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: '#1A2B3C' }}
            >
              {inviting ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send invite →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
const OnboardingTour = dynamic<{ onComplete: () => void }>(
  () => import('@/components/OnboardingTour'),
  { ssr: false }
)
import { supabase, Item, ChecklistItem } from '@/lib/supabase'
import { BOARDS, BOARD_MAP } from '@/lib/boards'
import { getSeedItems } from '@/lib/seeds'
import { User } from '@supabase/supabase-js'
import { useToast } from '@/components/ToastProvider'
import {
  Plus, LogOut, Share2, X, Check, ChevronDown, ChevronUp,
  Calendar, Bell, Search, CheckSquare, Layers, LayoutGrid, List,
  Phone, Settings, RefreshCw, MapPin, Tag, Flag, Sparkles
} from 'lucide-react'
import RecurringPicker, { RecurRule } from '@/components/RecurringPicker'
import PWAManager from '@/components/PWAManager'
import GlobalSearch from '@/components/GlobalSearch'

// ── Helpers ──────────────────────────────────────────────
const fmt = (d: string | null) => {
  if (!d) return ''
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
const daysUntil = (d: string | null) => {
  if (!d) return null
  const diff = Math.ceil((new Date(d + 'T00:00:00').getTime() - Date.now()) / 86400000)
  return diff
}
const urgencyClass = (d: string | null) => {
  const n = daysUntil(d)
  if (n === null) return ''
  if (n < 0)  return 'text-red-600 font-semibold'
  if (n <= 7) return 'text-orange-500 font-semibold'
  return 'text-[#5A7A94]'
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const urgencyLabel = (d: string | null, t?: any) => {
  const n = daysUntil(d)
  if (n === null) return ''
  if (n < 0)  return t ? t('daysOverdue', { n: Math.abs(n) }) : `${Math.abs(n)}d overdue`
  if (n === 0) return t ? t('today') : 'Today'
  if (n === 1) return t ? t('tomorrow') : 'Tomorrow'
  if (n <= 7) return t ? t('daysAway', { n }) : `${n}d away`
  return fmt(d)
}
const progress = (cl: ChecklistItem[]) =>
  cl.length === 0 ? null : Math.round((cl.filter(c => c.done).length / cl.length) * 100)

// ── Status pill ───────────────────────────────────────────
// ── Tooltip hint ──────────────────────────────────────────
function Hint({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex items-center" style={{ verticalAlign: 'middle' }}>
      <button
        onMouseEnter={() => setShow(true)}
        onFocus={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onBlur={() => setShow(false)}
        className="w-4 h-4 rounded-full bg-[#D4E6F1] text-[#5A7A94] text-[9px] font-bold flex items-center justify-center hover:bg-[#1B4F8A] hover:text-white transition-colors cursor-default"
        style={{ lineHeight: 1 }}
        aria-label="Help"
      >?</button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 bg-[#1A2B3C] text-white text-xs rounded-lg px-3 py-2 shadow-xl z-50 pointer-events-none" style={{ lineHeight: 1.5 }}>
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A2B3C]" />
        </span>
      )}
    </span>
  )
}

function StatusPill({ status, board }: { status: string; board: string }) {
  const cfg = BOARD_MAP[board as keyof typeof BOARD_MAP]
  const map: Record<string, string> = {
    'rsvp-needed': 'bg-amber-100 text-amber-700',
    'accepted':    'bg-green-100 text-green-700',
    'declined':    'bg-red-100 text-red-600',
    'in-progress': 'bg-blue-100 text-blue-700',
    'submitted':   'bg-purple-100 text-purple-700',
    'applied':     'bg-indigo-100 text-indigo-700',
    'done':        'bg-gray-100 text-gray-500',
    'todo':        'bg-gray-100 text-gray-600',
  }
  const label = cfg?.statuses.find(s => s.value === status)?.label ?? status
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  )
}

// ── Board monogram ────────────────────────────────────────
function Monogram({ board, size = 28 }: { board: string; size?: number }) {
  const cfg = BOARD_MAP[board as keyof typeof BOARD_MAP]
  if (!cfg) return null
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg font-bold flex-shrink-0"
      style={{ width: size, height: size, background: cfg.color, color: '#fff', fontSize: size * 0.45, fontFamily: 'Georgia, serif' }}
    >
      {cfg.letter}
    </span>
  )
}

// ── Confetti Overlay — Phase 8 ───────────────────────────
function ConfettiOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: Math.random() * 8 + 6,
    color: ['#2874A6','#E67E22','#1E8449','#8E44AD','#E74C3C','#F5A623'][Math.floor(Math.random()*6)],
    duration: Math.random() * 2 + 1.5,
    delay: Math.random() * 0.8,
    isCircle: Math.random() > 0.5,
  }))
  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden">
      <style>{`@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:`${p.left}%`, top:'-20px',
          width:p.size, height:p.size,
          borderRadius: p.isCircle ? '50%' : '2px',
          background: p.color,
          animation: `confettiFall ${p.duration}s ease-in forwards`,
          animationDelay: `${p.delay}s`,
        }} />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 text-center animate-bounce">
          <div className="text-4xl mb-2">🎉</div>
          <div className="font-bold text-[#1A2B3C] text-lg">Done!</div>
        </div>
      </div>
    </div>
  )
}

// ── Share Modal (placeholder) ─────────────────────────────
function ShareModal({ board, onClose }: { board: string; onClose: () => void }) {
  const cfg = BOARD_MAP[board as keyof typeof BOARD_MAP]
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-md rounded-t-2xl shadow-2xl max-h-[85dvh] overflow-y-auto sheet-animate">
        <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 rounded-full bg-[#D4E6F1]" /></div>
        <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Monogram board={board} size={32} />
            <div>
              <div className="font-semibold text-[#1A2B3C]">Share {cfg?.label}</div>
              <div className="text-xs text-[#5A7A94]">Invite family members to this board</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#5A7A94] hover:text-[#1A2B3C]"><X size={20} /></button>
        </div>

        <div className="rounded-xl border-2 border-dashed border-[#D4E6F1] bg-[#EBF3FB] p-6 text-center mb-4">
          <Share2 size={32} className="mx-auto text-[#1B4F8A] mb-3" />
          <div className="font-semibold text-[#1B4F8A] mb-1">Board sharing — coming soon</div>
          <div className="text-sm text-[#5A7A94]">
            You'll be able to invite family members to view or contribute to this board.
            Each person uses their own account — everyone sees the same items in real time.
          </div>
        </div>

        <div className="bg-[#FFF8F0] rounded-xl p-4 mb-4">
          <div className="text-xs font-semibold text-[#F5A623] uppercase tracking-wide mb-2">Planned sharing levels</div>
          {[
            ['Viewer', 'Can see all items but cannot edit'],
            ['Contributor', 'Can add items and check off tasks'],
            ['Co-owner', 'Full access including inviting others'],
          ].map(([role, desc]) => (
            <div key={role} className="flex gap-2 text-sm mb-1">
              <span className="font-medium text-[#1A2B3C] w-24 flex-shrink-0">{role}</span>
              <span className="text-[#5A7A94]">{desc}</span>
            </div>
          ))}
        </div>

        <div className="text-xs text-[#5A7A94] text-center mb-4">
          Would sharing help you? Let us know at <span className="text-[#1B4F8A]">hello@clarityboards.com</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#1B4F8A] text-white font-medium hover:bg-[#15407A] transition-colors"
        >
          Got it
        </button>
        </div>
      </div>
    </div>
  )
}

// ── Add Item Modal ────────────────────────────────────────
function AddModal({ defaultBoard, onSave, onClose }: {
  defaultBoard: string
  onSave: (item: Partial<Item>, recurRule?: RecurRule | null) => void
  onClose: () => void
}) {
  const [board,     setBoard]     = useState(defaultBoard)
  const [title,     setTitle]     = useState('')
  const [date,      setDate]      = useState('')
  const [notes,     setNotes]     = useState('')
  const [recurRule, setRecurRule] = useState<RecurRule | null>(null)
  const cfg = BOARD_MAP[board as keyof typeof BOARD_MAP]

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg rounded-t-2xl shadow-2xl sm:max-h-[90vh] max-h-[92dvh] overflow-y-auto sheet-animate">
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#D4E6F1]" />
        </div>
        <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#1A2B3C]">Add Item</h2>
          <button onClick={onClose} className="text-[#5A7A94] hover:text-[#1A2B3C] p-1"><X size={20} /></button>
        </div>

        {/* Board selector */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide mb-2 block">Board</label>
          <div className="flex flex-wrap gap-2">
            {BOARDS.map(b => (
              <button
                key={b.id}
                onClick={() => setBoard(b.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all"
                style={board === b.id
                  ? { background: b.color, color: '#fff', borderColor: b.color }
                  : { background: '#fff', color: '#5A7A94', borderColor: '#D4E6F1' }}
              >
                <span className="font-bold" style={{ fontFamily: 'Georgia, serif' }}>{b.letter}</span>
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide mb-1 block">Title *</label>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={`e.g. ${cfg?.tagline}`}
            className="w-full border border-[#D4E6F1] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30"
          />
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide mb-1 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-[#D4E6F1] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30"
          />
        </div>

        {/* Recurring — show only when a date is set */}
        {date && (
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide mb-2 block">Repeat</label>
            <RecurringPicker value={recurRule} onChange={setRecurRule} color={cfg?.color} />
          </div>
        )}

        {/* Notes */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide mb-1 block">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Location, instructions, reminders…"
            className="w-full border border-[#D4E6F1] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#D4E6F1] text-[#5A7A94] font-medium hover:bg-[#EBF3FB] transition-colors text-sm">
            Cancel
          </button>
          <button
            onClick={() => {
              if (!title.trim()) return
              onSave(
                { board: board as Item['board'], title: title.trim(), date: date || null, notes: notes || null, status: cfg?.statuses[0]?.value ?? 'todo', checklist: [] },
                recurRule
              )
            }}
            className="flex-1 py-2.5 rounded-xl text-white font-medium transition-colors text-sm"
            style={{ background: cfg?.color }}
          >
            Add Item
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}

// ── Item Detail Modal ─────────────────────────────────────
// ── Item Detail Modal ─────────────────────────────────────
const PRIORITY_OPTIONS = [
  { value: 'high',   label: '🔴 High',   color: '#E74C3C' },
  { value: 'medium', label: '🟡 Medium', color: '#E67E22' },
  { value: 'low',    label: '🟢 Low',    color: '#27AE60' },
]

function DetailModal({ item, onUpdate, onDelete, onClose, boardNames = {} }: {
  item: Item
  onUpdate: (updates: Partial<Item>) => void
  onDelete: () => void
  onClose: () => void
  boardNames?: Record<string, string>
}) {
  const t = useTranslations('dashboard')
  const cfg = BOARD_MAP[item.board]
  const [newTask, setNewTask]         = useState('')
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const pct = progress(item.checklist)

  const [editTitle,    setEditTitle]    = useState(item.title)
  const [editDate,     setEditDate]     = useState(item.date ?? '')
  const [editNotes,    setEditNotes]    = useState(item.notes ?? '')
  const [editLocation, setEditLocation] = useState((item as any).location ?? '')
  const [editPriority, setEditPriority] = useState((item as any).priority ?? '')
  const [newTag,       setNewTag]       = useState('')
  const [tags,         setTags]         = useState<string[]>((item as any)._tags ?? [])

  const saveTitle    = () => { if (editTitle.trim() && editTitle !== item.title) onUpdate({ title: editTitle.trim() }) }
  const saveDate     = () => { const v = editDate || null; if (v !== item.date) onUpdate({ date: v }) }
  const saveNotes    = () => { const v = editNotes.trim() || null; if (v !== item.notes) onUpdate({ notes: v }) }
  const saveLocation = () => { const v = editLocation.trim() || null; if (v !== (item as any).location) onUpdate({ location: v } as any) }
  const savePriority = (p: string) => { setEditPriority(p); onUpdate({ priority: p || null } as any) }

  const addTag = () => {
    const t = newTag.trim().toLowerCase()
    if (!t || tags.includes(t)) return
    const updated = [...tags, t]
    setTags(updated)
    onUpdate({ _tags: updated } as any)
    setNewTag('')
  }
  const removeTag = (t: string) => {
    const updated = tags.filter(x => x !== t)
    setTags(updated)
    onUpdate({ _tags: updated } as any)
  }

  const toggleCheck = (id: string) => {
    const updated = item.checklist.map(c => c.id === id ? { ...c, done: !c.done } : c)
    onUpdate({ checklist: updated })
  }
  const addTask = () => {
    if (!newTask.trim()) return
    const updated = [...item.checklist, { id: Date.now().toString(), text: newTask.trim(), done: false }]
    onUpdate({ checklist: updated })
    setNewTask('')
  }
  const startEdit = (c: ChecklistItem) => { setEditingId(c.id); setEditingText(c.text) }
  const saveEdit  = (id: string) => {
    if (!editingText.trim()) return
    const updated = item.checklist.map(c => c.id === id ? { ...c, text: editingText.trim() } : c)
    onUpdate({ checklist: updated })
    setEditingId(null)
  }
  const deleteTask = (id: string) => { onUpdate({ checklist: item.checklist.filter(c => c.id !== id) }) }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg sm:max-h-[90vh] max-h-[92dvh] overflow-y-auto rounded-t-2xl sheet-animate">
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#D4E6F1]" />
        </div>
        <div className="sticky top-0 bg-white rounded-t-2xl px-6 pt-4 pb-4 border-b border-[#EBF3FB]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Monogram board={item.board} size={36} />
              <div className="flex-1 min-w-0">
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={e => e.key === 'Enter' && saveTitle()}
                  className="font-semibold text-[#1A2B3C] text-base leading-tight w-full bg-transparent border-b border-transparent focus:border-[#1B4F8A] focus:outline-none pb-0.5 transition-colors"
                />
                <div className="text-xs text-[#5A7A94] mt-0.5">{boardNames[item.board] || cfg?.label}</div>
              </div>
            </div>
            <button onClick={onClose} className="text-[#5A7A94] hover:text-[#1A2B3C] flex-shrink-0"><X size={20} /></button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {/* Date + Priority row */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatusPill status={item.status} board={item.board} />
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-[#5A7A94]" />
              <input
                type="date" value={editDate}
                onChange={e => setEditDate(e.target.value)}
                onBlur={saveDate}
                className={`text-xs border-b bg-transparent focus:outline-none transition-colors ${editDate ? urgencyClass(editDate) : 'text-[#5A7A94]'} border-transparent focus:border-[#1B4F8A]`}
              />
              {editDate && <span className={`text-xs ${urgencyClass(editDate)}`}>· {urgencyLabel(editDate, t)}</span>}
            </div>
            {/* Priority */}
            <div className="flex items-center gap-1">
              {PRIORITY_OPTIONS.map(p => (
                <button key={p.value} onClick={() => savePriority(editPriority === p.value ? '' : p.value)}
                  title={p.label}
                  className="text-sm transition-all hover:scale-110"
                  style={{ opacity: editPriority === p.value ? 1 : 0.3 }}>
                  {p.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Status buttons */}
          <div>
            <div className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide mb-2">Update Status</div>
            <div className="flex flex-wrap gap-2">
              {cfg?.statuses.map(s => (
                <button key={s.value} onClick={() => onUpdate({ status: s.value })}
                  className="px-3 py-1 rounded-lg text-xs font-medium border transition-all"
                  style={item.status === s.value
                    ? { background: cfg.color, color: '#fff', borderColor: cfg.color }
                    : { background: '#fff', color: '#5A7A94', borderColor: '#D4E6F1' }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {item.board === 'event' && item.status === 'rsvp-needed' && (
            <div>
              <div className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide mb-2">Quick RSVP</div>
              <div className="flex gap-2">
                <button onClick={() => onUpdate({ status: 'accepted' })} className="flex-1 py-2 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-1">
                  <Check size={14} /> Accept
                </button>
                <button onClick={() => onUpdate({ status: 'declined' })} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-1">
                  <X size={14} /> Decline
                </button>
              </div>
            </div>
          )}

          {/* Location field — Phase 5 */}
          <div>
            <div className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide mb-1 flex items-center gap-1">
              <MapPin size={11} /> Location
            </div>
            <div className="flex items-center gap-2">
              <input
                value={editLocation}
                onChange={e => setEditLocation(e.target.value)}
                onBlur={saveLocation}
                onKeyDown={e => e.key === 'Enter' && saveLocation()}
                placeholder="Add address or location…"
                className="flex-1 text-sm text-[#1A2B3C] bg-[#EBF3FB] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30"
              />
              {editLocation && (
                <a
                  href={`https://maps.apple.com/?q=${encodeURIComponent(editLocation)}`}
                  target="_blank" rel="noreferrer"
                  className="text-xs font-semibold px-3 py-2 rounded-xl bg-[#2874A6] text-white whitespace-nowrap hover:bg-[#1f5f8a] transition-colors"
                >
                  Maps ↗
                </a>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide mb-1">Notes</div>
            <textarea
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              onBlur={saveNotes}
              rows={3}
              placeholder="Notes, instructions, reminders…"
              className="w-full text-sm text-[#1A2B3C] bg-[#EBF3FB] rounded-xl px-4 py-3 whitespace-pre-line resize-none focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30 transition-all"
            />
          </div>

          {/* Tags — Phase 4 */}
          <div>
            <div className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide mb-2 flex items-center gap-1">
              <Tag size={11} /> Tags
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#EBF3FB] text-[#1B4F8A]">
                  {t}
                  <button onClick={() => removeTag(t)} className="text-[#5A7A94] hover:text-red-400 transition-colors"><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="Add tag (e.g. Emma, BIO 301)…"
                className="flex-1 border border-[#D4E6F1] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30"
              />
              <button onClick={addTag} className="px-3 py-1.5 rounded-lg text-white text-sm font-medium flex-shrink-0" style={{ background: cfg?.color }}>Add</button>
            </div>
          </div>

          {/* Recurring schedule */}
          <div>
            <div className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <RefreshCw size={11} /> Repeat <Hint text="Set a recurring schedule. Clarityboards will automatically create the next occurrence each night at 2 AM." />
            </div>
            <RecurringPicker
              value={(item as any)._recurRule ?? null}
              onChange={rule => onUpdate({ _recurRule: rule } as any)}
              color={cfg?.color}
            />
            {(item as any)._recurRule && (
              <p className="text-xs text-[#5A7A94] mt-1.5">
                Next occurrence is created automatically each day at 2 AM.
              </p>
            )}
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide">Checklist</div>
              {pct !== null && <span className="text-xs text-[#5A7A94]">{pct}% complete</span>}
            </div>
            {pct !== null && (
              <div className="h-1.5 bg-[#EBF3FB] rounded-full mb-3">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cfg?.color }} />
              </div>
            )}
            <div className="space-y-1.5">
              {item.checklist.map(c => (
                <div key={c.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => toggleCheck(c.id)}
                    className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${c.done ? 'border-transparent' : 'border-[#D4E6F1] hover:border-[#1B4F8A]'}`}
                    style={c.done ? { background: cfg?.color } : {}}>
                    {c.done && <Check size={12} color="#fff" />}
                  </button>
                  {editingId === c.id ? (
                    <input autoFocus value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(c.id); if (e.key === 'Escape') setEditingId(null) }}
                      onBlur={() => saveEdit(c.id)}
                      className="flex-1 border border-[#1B4F8A] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30"
                    />
                  ) : (
                    <span
                      className={`flex-1 text-sm cursor-pointer select-none ${c.done ? 'line-through text-[#5A7A94]' : 'text-[#1A2B3C]'}`}
                      onDoubleClick={() => startEdit(c)}>
                      {c.text}
                    </span>
                  )}
                  {editingId !== c.id && (
                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => startEdit(c)} className="w-6 h-6 rounded flex items-center justify-center text-[#5A7A94] hover:text-[#1B4F8A] hover:bg-[#EBF3FB] transition-all">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => deleteTask(c.id)} className="w-6 h-6 rounded flex items-center justify-center text-[#5A7A94] hover:text-red-500 hover:bg-red-50 transition-all">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex gap-2 mt-3 pt-2 border-t border-[#EBF3FB]">
                <input value={newTask} onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  placeholder="Add a task… (press Enter)"
                  className="flex-1 border border-[#D4E6F1] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30"
                />
                <button onClick={addTask} className="px-3 py-1.5 rounded-lg text-white text-sm font-medium flex-shrink-0" style={{ background: cfg?.color }}>Add</button>
              </div>
              <p className="text-xs text-[#5A7A94] mt-1 hidden sm:block">Hover to edit or delete · Double-click to edit inline</p>
              <p className="text-xs text-[#5A7A94] mt-1 sm:hidden">Tap ✕ to delete a task</p>
            </div>
          </div>

          {/* Move to Board */}
          <div>
            <div className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide mb-2 flex items-center gap-1.5">
              Move to Board <Hint text="Move this item to a different board. It will disappear from the current view and appear in the destination board." />
            </div>
            <div className="flex flex-wrap gap-2">
              {BOARDS.map(b => (
                <button
                  key={b.id}
                  disabled={b.id === item.board}
                  onClick={() => onUpdate({ board: b.id as any })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-40 disabled:cursor-default"
                  style={b.id === item.board
                    ? { background: b.color, color: '#fff', borderColor: b.color }
                    : { background: '#fff', color: '#5A7A94', borderColor: '#D4E6F1' }}
                >
                  <Monogram board={b.id} size={16} />
                  {boardNames[b.id] || b.label}
                </button>
              ))}
            </div>
          </div>

          {confirmDelete ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600 font-medium mb-2">Delete this item? This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-1.5 rounded-lg border border-[#D4E6F1] text-[#5A7A94] text-xs font-medium hover:bg-white transition-colors">Cancel</button>
                <button onClick={onDelete} className="flex-1 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors">Yes, delete</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="w-full py-2 rounded-xl border border-red-200 text-red-500 text-sm hover:bg-red-50 transition-colors">
              Delete item
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ItemCard({ item, onClick, onSwipeComplete, isFirst = false }: {
  item: Item
  onClick: () => void
  onSwipeComplete: () => void
  isFirst?: boolean
}) {
  const t = useTranslations('dashboard')
  const cfg = BOARD_MAP[item.board]
  const pct = progress(item.checklist)
  const cardRef = useRef<HTMLDivElement>(null)
  const startX  = useRef(0)
  const [swipeX, setSwipeX] = useState(0)
  const [swiped, setSwiped] = useState(false)

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    setSwipeX(0)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current
    if (dx > 0) setSwipeX(Math.min(dx, 90)) // right swipe only, max 90px
  }
  const onTouchEnd = () => {
    if (swipeX > 55) {
      setSwiped(true)
      setTimeout(() => {
        onSwipeComplete()
        setSwiped(false)
        setSwipeX(0)
      }, 350)
    } else {
      setSwipeX(0)
    }
  }

  const isDone = item.status === 'done'

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe reveal layer */}
      <div
        className="absolute inset-y-0 left-0 flex items-center justify-start px-4 rounded-xl transition-all"
        style={{ background: '#27AE60', width: Math.max(swipeX, 0), opacity: swipeX > 10 ? 1 : 0 }}
      >
        <Check size={18} color="white" strokeWidth={2.5} />
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        onClick={() => { if (swipeX < 5) onClick() }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`bg-white border border-[#EBF3FB] hover:border-[#D4E6F1] hover:shadow-md transition-all cursor-pointer flex overflow-hidden rounded-xl ${isDone ? 'opacity-60' : ''} ${swiped ? 'scale-95 opacity-0' : ''}`}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swipeX === 0 ? 'transform 0.25s ease, opacity 0.3s ease, box-shadow 0.15s' : 'none',
        }}
      >
        <div className="w-1 flex-shrink-0" style={{ background: cfg?.color }} />
        <div className="flex-1 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Monogram board={item.board} size={24} />
              <span className={`font-medium text-[#1A2B3C] text-sm truncate ${isDone ? 'line-through text-[#5A7A94]' : ''}`}>{item.title}</span>
              {(item as any)._shared && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-[#EBF3FB] text-[#2874A6] flex-shrink-0">🔗 shared</span>
              )}
              {(item as any).added_by_user_id && (item as any).added_by_user_id !== item.user_id && (
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-[#FEF3E8] text-[#E67E22] flex-shrink-0">+ collab</span>
              )}
              {(item as any).recur_rule_id && (
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-[#F5EEF8] text-[#8E44AD] flex-shrink-0 flex items-center gap-0.5">
                  <RefreshCw size={9} />↺
                </span>
              )}
            </div>
            <span {...(isFirst ? { 'data-tour': 'status-badge' } : {})}>
              <StatusPill status={item.status} board={item.board} />
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            {item.date && (
              <span className={`text-xs ${urgencyClass(item.date)}`}>{urgencyLabel(item.date, t)}</span>
            )}
            {item.checklist.length > 0 && (
              <span
                {...(isFirst ? { 'data-tour': 'checklist' } : {})}
                className="text-xs text-[#5A7A94] flex items-center gap-1"
              >
                <CheckSquare size={11} />
                {item.checklist.filter(c=>c.done).length}/{item.checklist.length}
              </span>
            )}
          </div>
          {pct !== null && (
            <div className="mt-2 h-1 bg-[#EBF3FB] rounded-full">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cfg?.color }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════
// Demo period: everyone gets Pro for free
const DEMO_MODE = true
const FREE_ITEM_LIMIT = 10
const FREE_CHECKLIST_LIMIT = 3

// ── Upgrade Modal ─────────────────────────────────────────
function UpgradeModal({ onClose, itemCount }: { onClose: () => void; itemCount: number }) {
  const t = useTranslations('dashboard')
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-md rounded-t-2xl shadow-2xl overflow-hidden max-h-[92dvh] overflow-y-auto sheet-animate">
        <div style={{ background: 'linear-gradient(135deg, #1B4F8A, #2E9E8F)' }} className="px-8 py-8 text-center">
          <div className="text-4xl mb-3">⭐</div>
          <h2 className="text-white font-bold text-2xl" style={{ fontFamily: 'Georgia, serif' }}>Upgrade to Pro</h2>
          <p className="text-white/80 text-sm mt-2">{t('upgradeUnlock')}</p>
        </div>
        <div className="px-8 py-6">
          <div className="bg-[#EBF3FB] rounded-xl p-4 mb-5 text-center">
            <p className="text-2xl font-bold text-[#1B4F8A]" style={{ fontFamily: 'Georgia, serif' }}>$4.99<span className="text-base font-normal text-[#5A7A94]">/mo</span></p>
            <p className="text-sm text-[#5A7A94] mt-1">or <strong className="text-[#1B4F8A]">$49.99/year</strong> — save 17%</p>
            <p className="text-xs text-[#5A7A94] mt-1">🎉 Free during our demo period · No credit card required</p>
          </div>
          <div className="space-y-3 mb-6">
            {[
              { icon: '📋', title: t('upgrade.unlimitedItems'), desc: t('upgrade.unlimitedItemsDesc', { limit: FREE_ITEM_LIMIT }) },
              { icon: '🗂️', title: t('upgrade.allBoards'),    desc: t('upgrade.allBoardsDesc') },
              { icon: '✅', title: t('upgrade.unlimitedChecklists'), desc: t('upgrade.unlimitedChecklistsDesc', { limit: FREE_CHECKLIST_LIMIT }) },
              { icon: '👨‍👩‍👧', title: t('upgrade.sharing'), desc: t('upgrade.sharingDesc') },
              { icon: '🤖', title: t('upgrade.aiForwarding'),   desc: t('upgrade.aiForwardingDesc') },
            ].map(f => (
              <div key={f.title} className="flex gap-3 items-start">
                <span className="text-lg flex-shrink-0">{f.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-[#1A2B3C]">{f.title}</div>
                  <div className="text-xs text-[#5A7A94]">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-white font-bold text-base mb-3 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1B4F8A, #2E9E8F)' }}
          >
            Unlock Pro — Free Now →
          </button>
          <button onClick={onClose} className="w-full py-2 text-sm text-[#5A7A94] hover:text-[#1A2B3C] mb-2">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Calendar Month View ───────────────────────────────────
function CalendarView({ items, onItemClick }: { items: Item[]; onItemClick: (item: Item) => void }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))
  const goToToday = () => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))

  // Build a map: "YYYY-MM-DD" → Item[]
  const itemsByDate: Record<string, Item[]> = {}
  items.forEach(item => {
    if (item.date) {
      const key = item.date.slice(0, 10)
      if (!itemsByDate[key]) itemsByDate[key] = []
      itemsByDate[key].push(item)
    }
  })

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Count items with no date for "unscheduled" section
  const unscheduledItems = items.filter(i => !i.date)

  const cells: Array<{ day: number | null; dateStr: string | null }> = []
  for (let i = 0; i < firstDayOfMonth; i++) cells.push({ day: null, dateStr: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, dateStr })
  }
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push({ day: null, dateStr: null })

  return (
    <div>
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-georgia font-bold text-lg text-[#1A2B3C]">{monthLabel}</h2>
          <button
            onClick={goToToday}
            className="text-xs px-2.5 py-1 rounded-lg border border-[#D4E6F1] text-[#5A7A94] hover:bg-[#EBF3FB] transition-colors font-medium"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5A7A94] hover:bg-[#EBF3FB] hover:text-[#1A2B3C] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5A7A94] hover:bg-[#EBF3FB] hover:text-[#1A2B3C] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-[#5A7A94] py-2 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-[#EBF3FB] rounded-xl overflow-hidden border border-[#EBF3FB]">
        {cells.map((cell, idx) => {
          if (!cell.day || !cell.dateStr) {
            return <div key={`empty-${idx}`} className="bg-[#F4F7FA] min-h-[80px]" />
          }
          const cellDate = new Date(cell.dateStr + 'T00:00:00')
          const isToday = cellDate.getTime() === today.getTime()
          const isPast  = cellDate < today
          const dayItems = itemsByDate[cell.dateStr] ?? []
          const MAX_VISIBLE = 2

          return (
            <div
              key={cell.dateStr}
              className={`bg-white min-h-[80px] p-1.5 ${isPast && !isToday ? 'opacity-60' : ''}`}
            >
              {/* Date number */}
              <div className="mb-1">
                <span
                  className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday
                      ? 'bg-[#1B4F8A] text-white'
                      : 'text-[#1A2B3C]'
                  }`}
                >
                  {cell.day}
                </span>
              </div>

              {/* Items for this day */}
              <div className="space-y-0.5">
                {dayItems.slice(0, MAX_VISIBLE).map(item => {
                  const cfg = BOARD_MAP[item.board]
                  return (
                    <button
                      key={item.id}
                      onClick={() => onItemClick(item)}
                      className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate transition-opacity hover:opacity-80"
                      style={{ background: `${cfg?.color}20`, color: cfg?.color, borderLeft: `2px solid ${cfg?.color}` }}
                      title={item.title}
                    >
                      {item.title}
                    </button>
                  )
                })}
                {dayItems.length > MAX_VISIBLE && (
                  <div className="text-[10px] text-[#5A7A94] pl-1 font-medium">
                    +{dayItems.length - MAX_VISIBLE} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Unscheduled items */}
      {unscheduledItems.length > 0 && (
        <div className="mt-5">
          <div className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5A7A94] inline-block" />
            No date ({unscheduledItems.length})
          </div>
          <div className="grid grid-cols-1 gap-2">
            {unscheduledItems.map(item => {
              const cfg = BOARD_MAP[item.board]
              return (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="flex items-center gap-2 bg-white rounded-xl border border-[#EBF3FB] hover:border-[#D4E6F1] px-3 py-2 text-left transition-all hover:shadow-sm w-full"
                >
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: cfg?.color }} />
                  <Monogram board={item.board} size={22} />
                  <span className="text-sm text-[#1A2B3C] truncate flex-1">{item.title}</span>
                  <StatusPill status={item.status} board={item.board} />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('dashboard')
  const [user,        setUser]        = useState<User | null>(null)
  const [items,       setItems]       = useState<Item[]>([])
  const [loading,     setLoading]     = useState(true)
  const [activeBoard, setActiveBoard] = useState<string>('all')
  const [showAdd,     setShowAdd]     = useState(false)
  const [detail,      setDetail]      = useState<Item | null>(null)
  const [shareBoard,  setShareBoard]  = useState<string | null>(null)
  const [search,      setSearch]      = useState('')
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [isPro,       setIsPro]       = useState(DEMO_MODE)
  const [activeBoards, setActiveBoards] = useState<string[]>([])
  const [showUpgrade,  setShowUpgrade]  = useState(false)
  const [showTour,     setShowTour]     = useState(false)
  const [viewMode,       setViewMode]       = useState<'list' | 'calendar'>('list')
  const [dueSoonOnly,    setDueSoonOnly]    = useState(false)
  const [showSettings,   setShowSettings]   = useState(false)
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [activeTag,      setActiveTag]      = useState<string>('')
  const [showConfetti,   setShowConfetti]   = useState(false)
  const [allTags,        setAllTags]        = useState<string[]>([])
  const [boardNames,     setBoardNames]     = useState<Record<string, string>>({}) // id → custom label

  // ── Auth check ──────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/'); return }
      setUser(data.user)
      loadItems(data.user.id)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Tour: auto-launch for first-time users ───────────────
  useEffect(() => {
    const seen = localStorage.getItem('cb_tour_complete')
    if (!seen) setShowTour(true)
  }, [])

  // ── Load custom board names ──────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cb_board_names')
      if (saved) setBoardNames(JSON.parse(saved))
    } catch {}
  }, [])

  // ── Load items ──────────────────────────────────────────
  const loadItems = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: true, nullsFirst: false })

    if (error) { console.error(error); setLoading(false); return }

    if (!data || data.length === 0) {
      // Brand new user — send to onboarding
      router.push('/onboarding')
      return
    }

    // Find board selection sentinel
    const sentinel = data.find(i => i.title?.startsWith('__boards__'))
    if (!sentinel) {
      setActiveBoards(BOARDS.map(b => b.id))
    } else {
      const boards = sentinel.title.replace('__boards__', '').split(',')
      setActiveBoards(DEMO_MODE ? BOARDS.map(b => b.id) : boards)
    }

    const realItems = data.filter(i => !i.title?.startsWith('__boards__'))

    // ── Load shared board items ──────────────────────────
    const { data: shares } = await supabase
      .from('board_shares')
      .select('owner_id, board_type, role')
      .eq('shared_user_id', uid)
      .eq('status', 'active')

    let sharedItems: Item[] = []
    if (shares && shares.length > 0) {
      for (const share of shares) {
        const { data: ownerItems } = await supabase
          .from('items')
          .select('*')
          .eq('user_id', share.owner_id)
          .eq('board', share.board_type)
          .not('title', 'like', '__boards__%')
          .order('date', { ascending: true, nullsFirst: false })
        if (ownerItems) {
          sharedItems = [...sharedItems, ...ownerItems.map(i => ({
            ...i,
            _shared: true,
            _shared_role: share.role,
            _shared_owner: share.owner_id,
          }))]
        }
      }
    }

    setItems([...realItems, ...sharedItems] as Item[])
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Seed new user ───────────────────────────────────────
  const seedUser = async (uid: string) => {
    const seeds = getSeedItems().map(s => ({ ...s, user_id: uid }))
    const { data, error } = await supabase.from('items').insert(seeds).select()
    if (!error && data) setItems(data as Item[])
    setLoading(false)
  }

  // ── Add item ────────────────────────────────────────────
  const addItem = async (partial: Partial<Item>, recurRule?: RecurRule | null) => {
    if (!user) return
    if (!isPro && items.length >= FREE_ITEM_LIMIT) {
      setShowAdd(false)
      setShowUpgrade(true)
      return
    }
    const { data, error } = await supabase
      .from('items')
      .insert({ ...partial, user_id: user.id })
      .select()
      .single()
    if (!error && data) {
      const newItem = data as Item

      // If a recur rule was set, create the recurring_rules row and link it
      if (recurRule && partial.date) {
        const { data: ruleData } = await supabase
          .from('recurring_rules')
          .insert({
            user_id:      user.id,
            board:        partial.board,
            title:        partial.title,
            item_template: {
              notes:     partial.notes ?? null,
              status:    partial.status ?? 'todo',
              checklist: partial.checklist ?? [],
            },
            frequency:    recurRule.frequency,
            interval_val: recurRule.interval_value,
            day_of_week:  recurRule.day_of_week ?? null,
            next_due:     partial.date,
            end_date:     recurRule.end_date ?? null,
          })
          .select()
          .single()

        if (ruleData) {
          // Link the item to its rule
          await supabase.from('items').update({ recur_rule_id: ruleData.id }).eq('id', newItem.id)
          ;(newItem as any).recur_rule_id = ruleData.id
          ;(newItem as any)._recurRule    = recurRule
        }
      }

      setItems(prev => [...prev, newItem].sort((a,b) => (a.date ?? 'z') > (b.date ?? 'z') ? 1 : -1))
      const boardName = BOARD_MAP[(partial.board as string)]?.label ?? 'your board'
      toast(`Added to ${boardName}${recurRule ? ' · repeating' : ''}`)
    }
    setShowAdd(false)
  }

  // ── Update item ─────────────────────────────────────────
  const updateItem = async (id: string, updates: Partial<Item>) => {
    // Handle virtual fields (tags, location, priority) separately
    const { _tags, location, priority, ...dbUpdates } = updates as any

    // Save tags to item_tags table
    if (_tags !== undefined) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('item_tags').delete().eq('item_id', id)
        if (_tags.length > 0) {
          await supabase.from('item_tags').insert(
            _tags.map((tag: string) => ({ item_id: id, user_id: user.id, tag }))
          )
        }
        setItems(prev => prev.map(i => i.id === id ? { ...i, _tags } as any : i))
        if (detail?.id === id) setDetail(prev => prev ? { ...prev, _tags } as any : prev)
      }
      return
    }

    // Save location/priority directly to items table
    if (location !== undefined) dbUpdates.location = location
    if (priority !== undefined) dbUpdates.priority = priority

    if (Object.keys(dbUpdates).length === 0) return

    const { data, error } = await supabase.from('items').update(dbUpdates).eq('id', id).select().single()
    if (!error && data) {
      const updated = data as Item
      setItems(prev => prev.map(i => i.id === id ? { ...updated, _tags: (i as any)._tags } as any : i))
      setDetail(prev => prev ? { ...updated, _tags: (prev as any)._tags } as any : prev)
      if (dbUpdates.board && dbUpdates.board !== items.find(i => i.id === id)?.board) {
        const destLabel = BOARD_MAP[dbUpdates.board as keyof typeof BOARD_MAP]?.label ?? dbUpdates.board
        toast(`Moved to ${destLabel}`, 'info')
        setDetail(null)
      }
      if (dbUpdates.status) {
        toast(`Status updated to "${updated.status}"`, 'info')
        // Confetti for completing items with checklists or urgent flag
        if (dbUpdates.status === 'done') {
          const item = items.find(i => i.id === id)
          if (item && ((item as any).urgent || item.checklist.length >= 3)) {
            setShowConfetti(true)
          }
        }
      }
    }
  }

  // ── Board label (custom name or default) ────────────────
  const boardLabel = (id: string) => boardNames[id] || BOARD_MAP[id as keyof typeof BOARD_MAP]?.label || id

  // ── Delete item ─────────────────────────────────────────
  const deleteItem = async (id: string) => {
    const item = items.find(i => i.id === id)
    await supabase.from('items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    setDetail(null)
    toast(`"${item?.title ?? 'Item'}" deleted`, 'info')
  }

  // ── Swipe complete ──────────────────────────────────────
  const swipeComplete = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item || item.status === 'done') return
    await supabase.from('items').update({ status: 'done' }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'done' } : i))
    toast(`✓ "${item.title}" marked done`)
    // Confetti for big completions — urgent items or items with long checklists
    if ((item as any).urgent || item.checklist.length >= 3) setShowConfetti(true)
  }

  // ── Filtered items ──────────────────────────────────────
  const filtered = items.filter(i => {
    const boardMatch    = activeBoard === 'all' || i.board === activeBoard
    const searchMatch   = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.notes?.toLowerCase().includes(search.toLowerCase())
    const dueSoonMatch  = !dueSoonOnly || (() => { const n = daysUntil(i.date); return n !== null && n >= 0 && n <= 7 })()
    const priorityMatch = !priorityFilter || (i as any).priority === priorityFilter
    const tagMatch      = !activeTag || ((i as any)._tags ?? []).includes(activeTag)
    return boardMatch && searchMatch && dueSoonMatch && priorityMatch && tagMatch
  })

  const dueSoonCount = items.filter(i => { const n = daysUntil(i.date); return n !== null && n >= 0 && n <= 7 }).length

  // Collect all unique tags across items
  const allTagsComputed = [...new Set(items.flatMap(i => (i as any)._tags ?? []))] as string[]

  // ── Stats ───────────────────────────────────────────────
  const thisWeek  = items.filter(i => { const n = daysUntil(i.date); return n !== null && n >= 0 && n <= 7 }).length
  const rsvpNeed  = items.filter(i => i.status === 'rsvp-needed').length
  const openTasks = items.filter(i => i.status !== 'done').length

  // ── Sign out ────────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA]">
      <div className="text-[#1B4F8A] font-georgia text-xl animate-pulse">{t('loading')}</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F4F7FA]">

      {/* ── NAV ── */}
      <nav className="bg-[#1A2B3C] sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center h-14 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 mr-2 flex-shrink-0">
              <div className="flex gap-0.5">
                {[['#F5A623','#D4E6F1'],['#D4E6F1','#2E9E8F']].map((pair, r) => (
                  <div key={r} className="flex flex-col gap-0.5">
                    {pair.map((c,i) => <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{background:c}} />)}
                  </div>
                ))}
              </div>
              <span className="text-white font-georgia font-bold text-base hidden sm:block">Clarityboards</span>
            </div>

            {/* Board tabs — hidden on mobile (bottom nav handles it) */}
            <div data-tour="board-tabs" className="hidden sm:flex items-center gap-1 overflow-x-auto flex-1 scrollbar-hide">
              <button
                data-tour="unified-feed"
                onClick={() => setActiveBoard('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeBoard === 'all' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white/90'}`}
              >
                <Layers size={13} /> {t('allBoards')}
              </button>
              {BOARDS.map(b => {
                const locked = !isPro && !activeBoards.includes(b.id)
                return (
                  <button
                    key={b.id}
                    onClick={() => locked ? setShowUpgrade(true) : setActiveBoard(b.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeBoard === b.id ? 'bg-white/20 text-white' : locked ? 'text-white/30' : 'text-white/60 hover:text-white/90'}`}
                  >
                    <span className="w-4 h-4 rounded flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: locked ? '#888' : b.color, fontSize: 9, fontFamily: 'Georgia, serif' }}>{locked ? '🔒' : b.letter}</span>
                    <span className="hidden sm:inline">{boardLabel(b.id)}</span>
                    <span className="inline sm:hidden">{b.letter}</span>
                  </button>
                )
              })}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setSearchOpen(true)} className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Search all boards (⌘K)">
                <Search size={16} />
              </button>
              <button
                data-tour="upgrade-banner"
                onClick={() => setShowUpgrade(true)}
                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1 text-xs font-medium px-2"
              >
                ⭐ Pro
              </button>
              <button
                onClick={() => { localStorage.removeItem('cb_tour_complete'); setShowTour(true) }}
                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors hidden sm:block text-xs"
                title="Replay tour"
              >
                ?
              </button>

              {/* Settings dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(s => !s)}
                  className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  title="Settings"
                >
                  <Settings size={16} />
                </button>
                {showSettings && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-[#EBF3FB] z-50 overflow-hidden">
                      <div className="px-3 py-2 text-xs font-semibold text-[#5A7A94] uppercase tracking-wide border-b border-[#EBF3FB]">{t('settings')}</div>
                      <a
                        href="/settings/sharing"
                        onClick={() => setShowSettings(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#1A2B3C] hover:bg-[#EBF3FB] transition-colors"
                      >
                        <Share2 size={14} className="text-[#5A7A94]" />
                        {t('boardSharing')}
                      </a>
                      <a
                        href="/settings/phone"
                        onClick={() => setShowSettings(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#1A2B3C] hover:bg-[#EBF3FB] transition-colors"
                      >
                        <Phone size={14} className="text-[#5A7A94]" />
                        {t('smsForwarding')}
                      </a>
                      <a
                        href="/settings/ical"
                        onClick={() => setShowSettings(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#1A2B3C] hover:bg-[#EBF3FB] transition-colors"
                      >
                        <Calendar size={14} className="text-[#5A7A94]" />
                        {t('calendarExport')}
                      </a>
                      <a
                        href="/settings/ical-subscriptions"
                        onClick={() => setShowSettings(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#1A2B3C] hover:bg-[#EBF3FB] transition-colors"
                      >
                        <RefreshCw size={14} className="text-[#5A7A94]" />
                        Subscribe to Calendars
                      </a>
                      <a
                        href="/settings/gcal"
                        onClick={() => setShowSettings(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#1A2B3C] hover:bg-[#EBF3FB] transition-colors"
                      >
                        <span className="text-sm">📅</span>
                        Google Calendar Sync
                      </a>
                      <a
                        href="/settings/boards"
                        onClick={() => setShowSettings(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#1A2B3C] hover:bg-[#EBF3FB] transition-colors"
                      >
                        <span className="text-sm">✏️</span>
                        Rename Boards
                      </a>
                      <a
                        href="/settings/export"
                        onClick={() => setShowSettings(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#1A2B3C] hover:bg-[#EBF3FB] transition-colors"
                      >
                        <span className="text-sm">📤</span>
                        Export &amp; Connect
                      </a>
                      <a
                        href="/settings/zapier"
                        onClick={() => setShowSettings(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#1A2B3C] hover:bg-[#EBF3FB] transition-colors"
                      >
                        <span className="text-sm">⚡</span>
                        Zapier Integration
                      </a>
                      <a
                        href="/settings/notifications"
                        onClick={() => setShowSettings(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#1A2B3C] hover:bg-[#EBF3FB] transition-colors"
                      >
                        <span className="text-sm">🔔</span>
                        Notifications
                      </a>
                      <a
                        href="/settings/templates"
                        onClick={() => setShowSettings(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#1A2B3C] hover:bg-[#EBF3FB] transition-colors"
                      >
                        <span className="text-sm">📋</span>
                        Templates
                      </a>
                      <a
                        href="/settings/language"
                        onClick={() => setShowSettings(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#1A2B3C] hover:bg-[#EBF3FB] transition-colors"
                      >
                        <span className="text-sm">🌐</span>
                        {t('language')}
                      </a>
                      <div className="border-t border-[#EBF3FB]">
                        <button
                          onClick={() => { setShowSettings(false); signOut() }}
                          className="flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                        >
                          <LogOut size={14} />
                          {t('signOut')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button onClick={signOut} className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors sm:hidden">
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* Search bar */}
          {searchOpen && (
            <div className="pb-2">
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full bg-white/10 text-white placeholder-white/40 rounded-lg px-4 py-2 text-sm focus:outline-none focus:bg-white/20 transition-colors"
              />
            </div>
          )}
        </div>
      </nav>

      {/* ── STATS STRIP ── */}
      <div className="bg-white border-b border-[#EBF3FB]">
        {/* Mobile: compact 2-column stats */}
        <div className="sm:hidden px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-4">
              {[
                { label: t('thisWeek'), value: thisWeek,  color: '#1B4F8A' },
                { label: t('openItems'), value: openTasks, color: '#2E9E8F' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className="text-xl font-bold font-georgia" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-xs text-[#5A7A94] leading-tight">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {dueSoonCount > 0 && (
                <button
                  onClick={() => setDueSoonOnly(v => !v)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    dueSoonOnly ? 'bg-orange-500 text-white border-orange-500' : 'bg-orange-50 text-orange-500 border-orange-200'
                  }`}
                >
                  <Bell size={11} />
                  {dueSoonCount}
                </button>
              )}
              {/* View toggle — mobile */}
              <div className="flex items-center bg-[#F4F7FA] rounded-lg p-0.5 border border-[#EBF3FB]">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-[#1B4F8A] shadow-sm' : 'text-[#5A7A94]'}`}>
                  <List size={14} />
                </button>
                <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white text-[#1B4F8A] shadow-sm' : 'text-[#5A7A94]'}`}>
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile filter pills row */}
          {(priorityFilter || activeTag || allTagsComputed.length > 0) && (
            <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-hide pb-1">
              {[{ value: 'high', emoji: '🔴' }, { value: 'medium', emoji: '🟡' }, { value: 'low', emoji: '🟢' }].map(p => (
                <button key={p.value}
                  onClick={() => setPriorityFilter(v => v === p.value ? '' : p.value)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex-shrink-0 min-h-0 ${
                    priorityFilter === p.value ? 'bg-[#1A2B3C] text-white border-[#1A2B3C]' : 'bg-white text-[#5A7A94] border-[#E8E2D9]'
                  }`}
                >
                  {p.emoji} {priorityFilter === p.value && <X size={9} />}
                </button>
              ))}
              {allTagsComputed.slice(0, 3).map(tag => (
                <button key={tag}
                  onClick={() => setActiveTag(tg => tg === tag ? '' : tag)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all flex-shrink-0 min-h-0 ${
                    activeTag === tag ? 'bg-[#2874A6] text-white border-[#2874A6]' : 'bg-[#EBF3FB] text-[#2874A6] border-[#AED6F1]'
                  }`}
                >
                  #{tag} {activeTag === tag && <X size={9} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: original full strip */}
        <div className="hidden sm:flex max-w-5xl mx-auto px-4 py-3 gap-6 overflow-x-auto">
          {[
            { label: t('thisWeek'),     value: thisWeek,  color: '#1B4F8A' },
            { label: t('rsvpsNeeded'),  value: rsvpNeed,  color: '#F5A623' },
            { label: t('openItems'),    value: openTasks, color: '#2E9E8F' },
            { label: t('totalItems'),   value: items.length, color: '#5A7A94' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 flex-shrink-0">
              <span className="text-2xl font-bold font-georgia" style={{ color: s.color }}>{s.value}</span>
              <span className="text-xs text-[#5A7A94] leading-tight">{s.label}</span>
            </div>
          ))}

          {dueSoonCount > 0 && (
            <button
              onClick={() => setDueSoonOnly(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all flex-shrink-0 ${
                dueSoonOnly ? 'bg-orange-500 text-white border-orange-500' : 'bg-orange-50 text-orange-500 border-orange-200 hover:bg-orange-100'
              }`}
            >
              <Bell size={11} />
              {t('dueThisWeek')} · {dueSoonCount}
              {dueSoonOnly && <X size={10} className="ml-0.5" />}
            </button>
          )}

          {[{ value: 'high', emoji: '🔴' }, { value: 'medium', emoji: '🟡' }, { value: 'low', emoji: '🟢' }].map(p => (
            <button key={p.value}
              onClick={() => setPriorityFilter(v => v === p.value ? '' : p.value)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex-shrink-0 ${
                priorityFilter === p.value ? 'bg-[#1A2B3C] text-white border-[#1A2B3C]' : 'bg-white text-[#5A7A94] border-[#E8E2D9] hover:border-[#1A2B3C]'
              }`}
              title={`Filter ${p.value} priority`}
            >
              {p.emoji} {priorityFilter === p.value && <X size={9} />}
            </button>
          ))}

          {allTagsComputed.slice(0, 5).map(tag => (
            <button key={tag}
              onClick={() => setActiveTag(tg => tg === tag ? '' : tag)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all flex-shrink-0 ${
                activeTag === tag ? 'bg-[#2874A6] text-white border-[#2874A6]' : 'bg-[#EBF3FB] text-[#2874A6] border-[#AED6F1] hover:bg-[#2874A6] hover:text-white'
              }`}
            >
              #{tag} {activeTag === tag && <X size={9} />}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center bg-[#F4F7FA] rounded-lg p-0.5 border border-[#EBF3FB]">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white text-[#1B4F8A] shadow-sm' : 'text-[#5A7A94] hover:text-[#1A2B3C]'}`}
                title={t('listView')}
              >
                <List size={13} />
                <span>{t('listView')}</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'calendar' ? 'bg-white text-[#1B4F8A] shadow-sm' : 'text-[#5A7A94] hover:text-[#1A2B3C]'}`}
                title={t('calendarView')}
              >
                <LayoutGrid size={13} />
                <span>{t('calendarView')}</span>
              </button>
            </div>
            {user?.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="" className="w-7 h-7 rounded-full" />
            )}
            <span className="text-xs text-[#5A7A94]">
              {user?.user_metadata?.full_name?.split(' ')[0] ?? t('welcome')}
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-5xl mx-auto px-4 py-4 sm:py-6 pb-24 sm:pb-6">

        {/* Board header when filtered */}
        {activeBoard !== 'all' && (() => {
          const cfg = BOARD_MAP[activeBoard as keyof typeof BOARD_MAP]
          return (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Monogram board={activeBoard} size={40} />
                <div>
                  <div className="font-georgia font-bold text-xl text-[#1A2B3C]">{boardLabel(activeBoard)}</div>
                  <div className="text-sm text-[#5A7A94]">{cfg?.tagline}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/settings/export?board=${activeBoard}`}
                  data-tour="export-button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4E6F1] text-[#5A7A94] text-xs font-medium hover:bg-[#EBF3FB] transition-colors"
                  title="Export this board to NotebookLM, AI tools, or plain text"
                >
                  <span className="text-xs">📤</span> Export
                </a>
                <button
                  onClick={() => setShareBoard(activeBoard)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4E6F1] text-[#5A7A94] text-xs font-medium hover:bg-[#EBF3FB] transition-colors"
                >
                  <Share2 size={13} /> {t('shareBoard')}
                </button>
              </div>
            </div>
          )
        })()}

        {/* Items — list or calendar view */}
        {viewMode === 'calendar' ? (
          <CalendarView items={filtered} onItemClick={setDetail} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📋</div>
            <div className="font-semibold text-[#1A2B3C] mb-1">{t('noItemsTitle')}</div>
            <div className="text-sm text-[#5A7A94] mb-4">{t('noItemsDesc')}</div>
            <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-xl bg-[#1B4F8A] text-white text-sm font-medium hover:bg-[#15407A] transition-colors">
              {t('addItem')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((item, index) => (
              <ItemCard key={item.id} item={item} onClick={() => setDetail(item)} onSwipeComplete={() => swipeComplete(item.id)} isFirst={index === 0} />
            ))}
          </div>
        )}
      </main>

      {/* ── FAB ── */}
      <button
        data-tour="add-button"
        onClick={() => setShowAdd(true)}
        className="fixed right-4 w-14 h-14 rounded-full bg-[#1B4F8A] text-white shadow-lg hover:bg-[#15407A] transition-colors flex items-center justify-center z-20 sm:bottom-6 bottom-[max(5rem,calc(4rem+env(safe-area-inset-bottom)))]"
      >
        <Plus size={24} />
      </button>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-20 bg-[#1A2B3C] border-t border-white/10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center h-14">
          <button
            onClick={() => setActiveBoard('all')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all ${activeBoard === 'all' ? 'text-white' : 'text-white/40'}`}
          >
            <Layers size={18} />
            <span className="text-[10px] font-medium">All</span>
          </button>
          {BOARDS.map(b => {
            const locked = !isPro && !activeBoards.includes(b.id)
            return (
              <button
                key={b.id}
                onClick={() => locked ? setShowUpgrade(true) : setActiveBoard(b.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all ${activeBoard === b.id ? 'text-white' : locked ? 'text-white/20' : 'text-white/40'}`}
              >
                <span
                  className="w-5 h-5 rounded flex items-center justify-center text-white font-bold"
                  style={{ background: locked ? '#555' : b.color, fontSize: 9, fontFamily: 'Georgia, serif' }}
                >
                  {locked ? '🔒' : b.letter}
                </span>
                <span className="text-[10px] font-medium truncate max-w-[40px]">{boardLabel(b.id).replace('Board','')}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* ── MODALS ── */}
      {showAdd      && <AddModal    defaultBoard={activeBoard === 'all' ? 'event' : activeBoard} onSave={(item, rule) => addItem(item, rule)} onClose={() => setShowAdd(false)} />}
      {detail       && <DetailModal item={detail} onUpdate={u => updateItem(detail.id, u)} onDelete={() => deleteItem(detail.id)} onClose={() => setDetail(null)} boardNames={boardNames} />}
      {shareBoard   && <ShareModal  board={shareBoard} onClose={() => setShareBoard(null)} />}
      {showUpgrade  && <UpgradeModal onClose={() => setShowUpgrade(false)} itemCount={items.length} />}

      {/* ── CONFETTI ── Phase 8 */}
      {showConfetti && (
        <div className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: '-20px',
              width: Math.random() * 8 + 6,
              height: Math.random() * 8 + 6,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              background: ['#2874A6','#E67E22','#1E8449','#8E44AD','#E74C3C','#F5A623'][Math.floor(Math.random()*6)],
              animation: `confettiFall ${Math.random() * 2 + 1.5}s ease-in forwards`,
              animationDelay: `${Math.random() * 0.8}s`,
            }} />
          ))}
          <style>{`@keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity:1; } 100% { transform: translateY(110vh) rotate(720deg); opacity:0; } }`}</style>
        </div>
      )}

      {/* ── CONFETTI Phase 8 ── */}
      {showConfetti && (
        <ConfettiOverlay onDone={() => setShowConfetti(false)} />
      )}

      {/* ── ONBOARDING TOUR ── */}
      {showTour && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <OnboardingTour onComplete={() => {
            localStorage.setItem('cb_tour_complete', '1')
            setShowTour(false)
          }} />
        </div>
      )}

      {/* Global Search Modal */}
      {searchOpen && (
        <GlobalSearch
          onSelectItem={(board, itemId) => {
            setActiveBoard(board as any)
            // Small delay so board switches before item opens
            setTimeout(() => {
              const item = items.find(i => i.id === itemId)
              if (item) setDetail(item)
            }, 100)
          }}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {/* PWA Install Banner */}
      <PWAManager />

      {/* Cmd+K / Ctrl+K to open search */}
      <KeyboardShortcut onSearch={() => setSearchOpen(true)} />
    </div>
  )
}

// Lightweight component to handle Cmd+K without adding an effect to the main component
function KeyboardShortcut({ onSearch }: { onSearch: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onSearch()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onSearch])
  return null
}

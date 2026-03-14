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

// ─── Design tokens (warm editorial palette) ──────────────
const T = {
  cream:      '#FAFAF8',
  ivory:      '#FFFFFF',
  sand:       '#F5F2EE',
  border:     '#E8E4DF',
  borderSoft: '#F0EDE8',
  muted:      '#C8B8A8',
  sub:        '#9C968F',
  inkMid:     '#5C5650',
  ink:        '#1A1714',
  accent:     '#8B6B52',
  serif:      "'Cormorant Garamond', Georgia, serif",
  sans:       "'DM Sans', system-ui, sans-serif",
}

// ─── Helpers ──────────────────────────────────────────────
const fmt = (d: string | null) => {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
const daysUntil = (d: string | null) => {
  if (!d) return null
  return Math.ceil((new Date(d + 'T00:00:00').getTime() - Date.now()) / 86400000)
}
const urgencyColor = (d: string | null) => {
  const n = daysUntil(d)
  if (n === null) return T.sub
  if (n < 0)  return '#C0392B'
  if (n <= 7) return '#C17A5A'
  return T.sub
}
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

// ─── Status Pill ──────────────────────────────────────────
function StatusPill({ status, board }: { status: string; board: string }) {
  const cfg = BOARD_MAP[board as keyof typeof BOARD_MAP]
  const map: Record<string, { bg: string; text: string }> = {
    'rsvp-needed': { bg: '#FEF3CD', text: '#8B6914' },
    'accepted':    { bg: '#EDF5F0', text: '#3D6B52' },
    'declined':    { bg: '#FCEBEB', text: '#A32D2D' },
    'in-progress': { bg: '#EAF4F8', text: '#2C6E8A' },
    'submitted':   { bg: '#F0EBF8', text: '#6B528B' },
    'applied':     { bg: '#EAF4F8', text: '#2C6E8A' },
    'done':        { bg: '#F5F2EE', text: '#9C968F' },
    'todo':        { bg: '#F5F2EE', text: '#9C968F' },
    'want-to-go':  { bg: '#EAF4F8', text: '#2C6E8A' },
    'planning':    { bg: '#FEF3CD', text: '#8B6914' },
    'booked':      { bg: '#EDF5F0', text: '#3D6B52' },
  }
  const label = cfg?.statuses.find(s => s.value === status)?.label ?? status
  const style = map[status] ?? { bg: '#F5F2EE', text: '#9C968F' }
  return (
    <span style={{
      fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 3,
      background: style.bg, color: style.text, letterSpacing: '0.04em',
      fontFamily: T.sans, whiteSpace: 'nowrap', textTransform: 'uppercase' as const,
    }}>{label}</span>
  )
}

// ─── Board Monogram ───────────────────────────────────────
function Monogram({ board, size = 28 }: { board: string; size?: number }) {
  const cfg = BOARD_MAP[board as keyof typeof BOARD_MAP]
  if (!cfg) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: size * 0.3,
      background: cfg.color, color: '#fff',
      fontSize: size * 0.45, fontFamily: T.serif, fontWeight: 600,
      flexShrink: 0,
    }}>{cfg.letter}</span>
  )
}

// ─── Hint Tooltip ─────────────────────────────────────────
function Hint({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
      <button
        onMouseEnter={() => setShow(true)} onFocus={() => setShow(true)}
        onMouseLeave={() => setShow(false)} onBlur={() => setShow(false)}
        style={{ width: 15, height: 15, borderRadius: '50%', background: T.sand, color: T.sub, fontSize: 8, fontWeight: 700, border: 'none', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >?</button>
      {show && (
        <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6, width: 200, background: T.ink, color: '#fff', fontSize: 11, borderRadius: 8, padding: '8px 12px', zIndex: 50, pointerEvents: 'none', lineHeight: 1.5, fontFamily: T.sans }}>
          {text}
        </span>
      )}
    </span>
  )
}

// ─── Confetti ─────────────────────────────────────────────
function ConfettiOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i, left: Math.random() * 100, size: Math.random() * 8 + 6,
    color: ['#2874A6','#C17A5A','#1E8449','#8E44AD','#C0392B','#C17A5A'][Math.floor(Math.random()*6)],
    duration: Math.random() * 2 + 1.5, delay: Math.random() * 0.8, isCircle: Math.random() > 0.5,
  }))
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>
      {pieces.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: `${p.left}%`, top: -20, width: p.size, height: p.size, borderRadius: p.isCircle ? '50%' : 2, background: p.color, animation: `confettiFall ${p.duration}s ease-in forwards`, animationDelay: `${p.delay}s` }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: T.ivory, borderRadius: 20, padding: '24px 36px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: T.serif }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
          <div style={{ fontSize: 22, color: T.ink, fontWeight: 500 }}>Done!</div>
        </div>
      </div>
    </div>
  )
}

// ─── Share Modal ──────────────────────────────────────────
function ShareModal({ board, onClose }: { board: string; onClose: () => void }) {
  const cfg = BOARD_MAP[board as keyof typeof BOARD_MAP]
  return (
    <BottomSheet onClose={onClose} maxWidth={440}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Monogram board={board} size={36} />
        <div>
          <div style={{ fontFamily: T.serif, fontSize: 20, color: T.ink, fontWeight: 500 }}>Share {cfg?.label}</div>
          <div style={{ fontSize: 12, color: T.sub }}>Invite family members to this board</div>
        </div>
        <button onClick={onClose} style={closeBtn}>×</button>
      </div>

      <div style={{ border: `1.5px dashed ${T.border}`, borderRadius: 14, padding: '28px 20px', textAlign: 'center', marginBottom: 16, background: T.cream }}>
        <Share2 size={28} color={T.sub} style={{ margin: '0 auto 10px' }} />
        <div style={{ fontFamily: T.serif, fontSize: 18, color: T.ink, marginBottom: 6 }}>Board sharing — coming soon</div>
        <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6 }}>Invite family members to view or contribute. Everyone sees the same items in real time.</div>
      </div>

      <div style={{ background: T.sand, borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Planned sharing levels</div>
        {[['Viewer','Can see all items but cannot edit'],['Contributor','Can add items and check off tasks'],['Co-owner','Full access including inviting others']].map(([role, desc]) => (
          <div key={role} style={{ display: 'flex', gap: 10, fontSize: 13, marginBottom: 6 }}>
            <span style={{ fontWeight: 600, color: T.ink, width: 90, flexShrink: 0 }}>{role}</span>
            <span style={{ color: T.sub }}>{desc}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: T.sub, textAlign: 'center', marginBottom: 16 }}>
        Would sharing help you? <span style={{ color: '#C17A5A' }}>hello@clarityboards.com</span>
      </div>
      <button onClick={onClose} style={primaryBtn(T.ink)}>Got it</button>
    </BottomSheet>
  )
}

// ─── Add Item Modal ───────────────────────────────────────
function AddModal({ defaultBoard, onSave, onClose }: {
  defaultBoard: string
  onSave: (item: Partial<Item>, recurRule?: RecurRule | null) => void
  onClose: () => void
}) {
  const [board, setBoard] = useState(defaultBoard)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [recurRule, setRecurRule] = useState<RecurRule | null>(null)
  const cfg = BOARD_MAP[board as keyof typeof BOARD_MAP]

  return (
    <BottomSheet onClose={onClose} maxWidth={520}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div style={{ fontFamily: T.serif, fontSize: 24, color: T.ink, fontWeight: 500 }}>Add Item</div>
        <button onClick={onClose} style={closeBtn}>×</button>
      </div>

      <div style={{ marginBottom: 18 }}>
        <Label>Board</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {BOARDS.map(b => (
            <button key={b.id} onClick={() => setBoard(b.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: T.sans, transition: 'all 0.15s',
                background: board === b.id ? b.color : T.sand,
                color: board === b.id ? '#fff' : T.sub,
              }}>
              <span style={{ fontFamily: T.serif, fontWeight: 600 }}>{b.letter}</span>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <Label>Title *</Label>
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
          placeholder={`e.g. ${cfg?.tagline}`} style={sheetInput} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <Label>Date</Label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={sheetInput} />
      </div>

      {date && (
        <div style={{ marginBottom: 14 }}>
          <Label>Repeat</Label>
          <RecurringPicker value={recurRule} onChange={setRecurRule} color={cfg?.color} />
        </div>
      )}

      <div style={{ marginBottom: 22 }}>
        <Label>Notes</Label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="Location, instructions, reminders…"
          style={{ ...sheetInput, resize: 'none' }} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={ghostBtn}>Cancel</button>
        <button onClick={() => {
          if (!title.trim()) return
          onSave({ board: board as Item['board'], title: title.trim(), date: date || null, notes: notes || null, status: cfg?.statuses[0]?.value ?? 'todo', checklist: [] }, recurRule)
        }} style={primaryBtn(cfg?.color ?? T.ink)}>Add Item</button>
      </div>
    </BottomSheet>
  )
}

// ─── Detail Modal ─────────────────────────────────────────
const PRIORITY_OPTIONS = [
  { value: 'high',   label: '🔴 High',   color: '#C0392B' },
  { value: 'medium', label: '🟡 Medium', color: '#C17A5A' },
  { value: 'low',    label: '🟢 Low',    color: '#5C8B6A' },
]

function DetailModal({ item, onUpdate, onDelete, onClose, boardNames = {} }: {
  item: Item; onUpdate: (updates: Partial<Item>) => void; onDelete: () => void; onClose: () => void; boardNames?: Record<string, string>
}) {
  const t = useTranslations('dashboard')
  const cfg = BOARD_MAP[item.board]
  const [newTask, setNewTask] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
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
    const tag = newTag.trim().toLowerCase()
    if (!tag || tags.includes(tag)) return
    const updated = [...tags, tag]; setTags(updated); onUpdate({ _tags: updated } as any); setNewTag('')
  }
  const removeTag = (tag: string) => {
    const updated = tags.filter(x => x !== tag); setTags(updated); onUpdate({ _tags: updated } as any)
  }
  const toggleCheck = (id: string) => { onUpdate({ checklist: item.checklist.map(c => c.id === id ? { ...c, done: !c.done } : c) }) }
  const addTask = () => {
    if (!newTask.trim()) return
    onUpdate({ checklist: [...item.checklist, { id: Date.now().toString(), text: newTask.trim(), done: false }] })
    setNewTask('')
  }
  const startEdit = (c: ChecklistItem) => { setEditingId(c.id); setEditingText(c.text) }
  const saveEdit  = (id: string) => {
    if (!editingText.trim()) return
    onUpdate({ checklist: item.checklist.map(c => c.id === id ? { ...c, text: editingText.trim() } : c) })
    setEditingId(null)
  }
  const deleteTask = (id: string) => { onUpdate({ checklist: item.checklist.filter(c => c.id !== id) }) }

  return (
    <BottomSheet onClose={onClose} maxWidth={520}>
      {/* Header with color band */}
      <div style={{ marginBottom: 20, paddingBottom: 18, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 4, borderRadius: 2, alignSelf: 'stretch', background: cfg?.color, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
              onBlur={saveTitle} onKeyDown={e => e.key === 'Enter' && saveTitle()}
              style={{ fontFamily: T.serif, fontSize: 22, color: T.ink, fontWeight: 500, background: 'transparent', border: 'none', outline: 'none', width: '100%', borderBottom: `1px solid transparent`, padding: '0 0 2px' }}
              onFocus={e => e.currentTarget.style.borderBottomColor = T.border}
            />
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{boardNames[item.board] || cfg?.label}</div>
          </div>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}>
        {/* Date + priority row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <StatusPill status={item.status} board={item.board} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={12} color={T.sub} />
            <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} onBlur={saveDate}
              style={{ fontSize: 12, background: 'transparent', border: 'none', outline: 'none', color: urgencyColor(editDate || null), fontFamily: T.sans }} />
            {editDate && <span style={{ fontSize: 11, color: urgencyColor(editDate) }}>· {urgencyLabel(editDate)}</span>}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {PRIORITY_OPTIONS.map(p => (
              <button key={p.value} onClick={() => savePriority(editPriority === p.value ? '' : p.value)}
                title={p.label} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: editPriority === p.value ? 1 : 0.25, transition: 'opacity 0.15s' }}>
                {p.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Status buttons */}
        <div>
          <Label>Update Status</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {cfg?.statuses.map(s => (
              <button key={s.value} onClick={() => onUpdate({ status: s.value })}
                style={{ padding: '5px 13px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: T.sans, transition: 'all 0.15s',
                  background: item.status === s.value ? cfg.color : T.sand,
                  color: item.status === s.value ? '#fff' : T.sub,
                }}>{s.label}</button>
            ))}
          </div>
        </div>

        {item.board === 'event' && item.status === 'rsvp-needed' && (
          <div>
            <Label>Quick RSVP</Label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onUpdate({ status: 'accepted' })} style={{ flex: 1, ...primaryBtn('#5C8B6A'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Check size={14} /> Accept
              </button>
              <button onClick={() => onUpdate({ status: 'declined' })} style={{ flex: 1, ...primaryBtn('#C0392B'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <X size={14} /> Decline
              </button>
            </div>
          </div>
        )}

        {/* Location */}
        <div>
          <Label><MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />Location</Label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={editLocation} onChange={e => setEditLocation(e.target.value)}
              onBlur={saveLocation} onKeyDown={e => e.key === 'Enter' && saveLocation()}
              placeholder="Add address or location…" style={{ ...sheetInput, marginBottom: 0, flex: 1 }} />
            {editLocation && (
              <a href={`https://maps.apple.com/?q=${encodeURIComponent(editLocation)}`} target="_blank" rel="noreferrer"
                style={{ padding: '9px 12px', borderRadius: 10, background: T.ink, color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                Maps ↗
              </a>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label>Notes</Label>
          <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} onBlur={saveNotes}
            rows={3} placeholder="Notes, instructions, reminders…"
            style={{ ...sheetInput, resize: 'none', marginBottom: 0 }} />
        </div>

        {/* Tags */}
        <div>
          <Label><Tag size={11} style={{ display: 'inline', marginRight: 4 }} />Tags</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {tags.map(tag => (
              <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: T.sand, color: T.ink }}>
                {tag}
                <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sub, padding: 0, display: 'flex' }}><X size={10} /></button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()}
              placeholder="Add tag…" style={{ ...sheetInput, marginBottom: 0, flex: 1 }} />
            <button onClick={addTag} style={primaryBtn(cfg?.color ?? T.ink)}>Add</button>
          </div>
        </div>

        {/* Recur */}
        <div>
          <Label><RefreshCw size={11} style={{ display: 'inline', marginRight: 4 }} />Repeat <Hint text="Set a recurring schedule. Clarityboards will automatically create the next occurrence each night." /></Label>
          <RecurringPicker value={(item as any)._recurRule ?? null} onChange={rule => onUpdate({ _recurRule: rule } as any)} color={cfg?.color} />
        </div>

        {/* Checklist */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Label style={{ marginBottom: 0 }}>Checklist</Label>
            {pct !== null && <span style={{ fontSize: 11, color: T.sub }}>{pct}%</span>}
          </div>
          {pct !== null && (
            <div style={{ height: 3, background: T.sand, borderRadius: 2, marginBottom: 12 }}>
              <div style={{ height: '100%', borderRadius: 2, background: cfg?.color, width: `${pct}%`, transition: 'width 0.3s' }} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {item.checklist.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => toggleCheck(c.id)}
                  style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, border: `1.5px solid ${c.done ? 'transparent' : T.border}`, background: c.done ? cfg?.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  {c.done && <Check size={11} color="#fff" />}
                </button>
                {editingId === c.id ? (
                  <input autoFocus value={editingText} onChange={e => setEditingText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(c.id); if (e.key === 'Escape') setEditingId(null) }}
                    onBlur={() => saveEdit(c.id)}
                    style={{ ...sheetInput, marginBottom: 0, flex: 1, padding: '5px 10px' }} />
                ) : (
                  <span onDoubleClick={() => startEdit(c)} style={{ flex: 1, fontSize: 13, color: c.done ? T.muted : T.ink, textDecoration: c.done ? 'line-through' : 'none', cursor: 'pointer' }}>{c.text}</span>
                )}
                {editingId !== c.id && (
                  <button onClick={() => deleteTask(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 2, display: 'flex' }}><X size={12} /></button>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 4, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
              <input value={newTask} onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="Add a task… (press Enter)"
                style={{ ...sheetInput, marginBottom: 0, flex: 1 }} />
              <button onClick={addTask} style={primaryBtn(cfg?.color ?? T.ink)}>Add</button>
            </div>
          </div>
        </div>

        {/* Move to board */}
        <div>
          <Label>Move to Board <Hint text="Move this item to a different board." /></Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {BOARDS.map(b => (
              <button key={b.id} disabled={b.id === item.board} onClick={() => onUpdate({ board: b.id as any })}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: b.id === item.board ? 'default' : 'pointer', fontSize: 11, fontWeight: 600, fontFamily: T.sans, opacity: b.id === item.board ? 0.5 : 1, transition: 'all 0.15s',
                  background: b.id === item.board ? b.color : T.sand,
                  color: b.id === item.board ? '#fff' : T.sub,
                }}>
                <Monogram board={b.id} size={16} />
                {boardNames[b.id] || b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Delete */}
        {confirmDelete ? (
          <div style={{ background: '#FDF6F3', borderRadius: 12, padding: 14 }}>
            <div style={{ fontFamily: T.serif, fontSize: 16, color: T.ink, marginBottom: 12 }}>Remove this item?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDelete(false)} style={ghostBtn}>Cancel</button>
              <button onClick={onDelete} style={primaryBtn('#C0392B')}>Delete</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            style={{ width: '100%', padding: '11px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.muted, fontSize: 13, cursor: 'pointer', fontFamily: T.sans }}>
            Delete item
          </button>
        )}
      </div>
    </BottomSheet>
  )
}

// ─── Item Card ────────────────────────────────────────────
function ItemCard({ item, onClick, onSwipeComplete, isFirst = false }: {
  item: Item; onClick: () => void; onSwipeComplete: () => void; isFirst?: boolean
}) {
  const t = useTranslations('dashboard')
  const cfg = BOARD_MAP[item.board]
  const pct = progress(item.checklist)
  const startX = useRef(0)
  const [swipeX, setSwipeX] = useState(0)
  const [swiped, setSwiped] = useState(false)
  const isDone = item.status === 'done'

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; setSwipeX(0) }
  const onTouchMove  = (e: React.TouchEvent) => { const dx = e.touches[0].clientX - startX.current; if (dx > 0) setSwipeX(Math.min(dx, 90)) }
  const onTouchEnd   = () => {
    if (swipeX > 55) { setSwiped(true); setTimeout(() => { onSwipeComplete(); setSwiped(false); setSwipeX(0) }, 350) }
    else setSwipeX(0)
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `0.5px solid ${T.borderSoft}` }}>
      {/* Swipe reveal */}
      <div style={{ position: 'absolute', inset: '0 auto 0 0', display: 'flex', alignItems: 'center', paddingLeft: 18, background: '#3D6B52', width: Math.max(swipeX, 0), opacity: swipeX > 10 ? 1 : 0, transition: 'opacity 0.1s' }}>
        <Check size={14} color="white" strokeWidth={2} />
      </div>

      {/* Row */}
      <div onClick={() => { if (swipeX < 5) onClick() }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        className="cb-row-item"
        style={{
          background: T.ivory, display: 'flex', alignItems: 'center', gap: 0,
          cursor: 'pointer', overflow: 'hidden',
          transform: `translateX(${swipeX}px)`,
          transition: swipeX === 0 ? 'transform 0.25s ease, opacity 0.3s' : 'none',
          opacity: isDone ? 0.5 : swiped ? 0 : 1,
        }}
      >
        {/* Board color accent — 2px left bar */}
        <div style={{ width: 2, alignSelf: 'stretch', background: cfg?.color, flexShrink: 0 }} />

        <div style={{ flex: 1, padding: '13px 16px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: pct !== null || item.date ? 5 : 0 }}>
                <span style={{ fontFamily: T.sans, fontWeight: 400, fontSize: 13, color: isDone ? T.sub : T.ink, textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>
                  {item.title}
                </span>
                {(item as any)._shared && (
                  <span style={{ fontSize: 9, fontWeight: 500, padding: '1px 6px', borderRadius: 3, background: T.sand, color: T.sub, flexShrink: 0, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>shared</span>
                )}
                {(item as any).recur_rule_id && (
                  <RefreshCw size={9} color={T.sub} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {item.date && (
                  <span style={{ fontSize: 11, color: urgencyColor(item.date), fontWeight: 300, letterSpacing: '0.01em' }}>
                    {urgencyLabel(item.date, t)}
                  </span>
                )}
                {item.checklist.length > 0 && (
                  <span {...(isFirst ? { 'data-tour': 'checklist' } : {})}
                    style={{ fontSize: 11, color: T.sub, display: 'flex', alignItems: 'center', gap: 3, fontWeight: 300 }}>
                    <CheckSquare size={10} strokeWidth={1.5} />
                    {item.checklist.filter(c => c.done).length}/{item.checklist.length}
                  </span>
                )}
              </div>

              {pct !== null && (
                <div style={{ marginTop: 7, height: 1.5, background: T.border, borderRadius: 1 }}>
                  <div style={{ height: '100%', borderRadius: 1, background: cfg?.color, width: `${pct}%`, transition: 'width 0.3s' }} />
                </div>
              )}
            </div>

            <span {...(isFirst ? { 'data-tour': 'status-badge' } : {})}>
              <StatusPill status={item.status} board={item.board} />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Upgrade Modal ────────────────────────────────────────
const DEMO_MODE = true
const FREE_ITEM_LIMIT = 10
const FREE_CHECKLIST_LIMIT = 3

function UpgradeModal({ onClose, itemCount }: { onClose: () => void; itemCount: number }) {
  const t = useTranslations('dashboard')
  return (
    <BottomSheet onClose={onClose} maxWidth={440}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>✦</div>
        <div style={{ fontFamily: T.serif, fontSize: 30, color: T.ink, fontWeight: 500, marginBottom: 6 }}>Upgrade to Pro</div>
        <div style={{ fontSize: 13, color: T.sub }}>{t('upgradeUnlock')}</div>
      </div>
      <div style={{ background: T.sand, borderRadius: 14, padding: '18px', marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontFamily: T.serif, fontSize: 36, color: T.ink, fontWeight: 500 }}>$7.99<span style={{ fontSize: 16, fontWeight: 400, color: T.sub }}>/mo</span></div>
        <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>or <strong style={{ color: T.ink }}>$79/year</strong> — save 17%</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>🎉 Free during demo · No card required</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
        {[
          { icon: '📋', title: t('upgrade.unlimitedItems'), desc: t('upgrade.unlimitedItemsDesc', { limit: FREE_ITEM_LIMIT }) },
          { icon: '🗂️', title: t('upgrade.allBoards'),    desc: t('upgrade.allBoardsDesc') },
          { icon: '✅', title: t('upgrade.unlimitedChecklists'), desc: t('upgrade.unlimitedChecklistsDesc', { limit: FREE_CHECKLIST_LIMIT }) },
          { icon: '👨‍👩‍👧', title: t('upgrade.sharing'), desc: t('upgrade.sharingDesc') },
          { icon: '🤖', title: t('upgrade.aiForwarding'),   desc: t('upgrade.aiForwardingDesc') },
        ].map(f => (
          <div key={f.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 1 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: T.sub }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onClose} style={primaryBtn(T.ink)}>Unlock Pro — Free Now →</button>
      <button onClick={onClose} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: T.sub, fontSize: 13, cursor: 'pointer', marginTop: 6, fontFamily: T.sans }}>Maybe later</button>
    </BottomSheet>
  )
}

// ─── Calendar View ────────────────────────────────────────
function CalendarView({ items, onItemClick }: { items: Item[]; onItemClick: (item: Item) => void }) {
  const [currentMonth, setCurrentMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1) })
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date(); today.setHours(0,0,0,0)
  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const itemsByDate: Record<string, Item[]> = {}
  items.forEach(item => { if (item.date) { const k = item.date.slice(0,10); if (!itemsByDate[k]) itemsByDate[k] = []; itemsByDate[k].push(item) } })

  const cells: Array<{ day: number | null; dateStr: string | null }> = []
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, dateStr: null })
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateStr: `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` })
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, dateStr: null })

  const unscheduled = items.filter(i => !i.date)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: T.serif, fontSize: 22, color: T.ink, fontWeight: 500 }}>{monthLabel}</div>
          <button onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: `1px solid ${T.border}`, background: T.ivory, color: T.sub, cursor: 'pointer', fontFamily: T.sans }}>Today</button>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['←', () => setCurrentMonth(new Date(year, month-1, 1))], ['→', () => setCurrentMonth(new Date(year, month+1, 1))]].map(([arrow, fn]) => (
            <button key={arrow as string} onClick={fn as any}
              style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${T.border}`, background: T.ivory, color: T.sub, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {arrow as string}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: T.sub, padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: T.border, borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.border}` }}>
        {cells.map((cell, idx) => {
          if (!cell.day || !cell.dateStr) return <div key={`e-${idx}`} style={{ background: T.cream, minHeight: 80 }} />
          const cellDate = new Date(cell.dateStr + 'T00:00:00')
          const isToday = cellDate.getTime() === today.getTime()
          const isPast  = cellDate < today
          const dayItems = itemsByDate[cell.dateStr] ?? []
          return (
            <div key={cell.dateStr} style={{ background: T.ivory, minHeight: 80, padding: 6, opacity: isPast && !isToday ? 0.6 : 1 }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ display: 'inline-flex', width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: 12, fontWeight: 600, background: isToday ? T.ink : 'transparent', color: isToday ? '#fff' : T.ink }}>{cell.day}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {dayItems.slice(0, 2).map(item => {
                  const cfg = BOARD_MAP[item.board]
                  return (
                    <button key={item.id} onClick={() => onItemClick(item)}
                      style={{ width: '100%', textAlign: 'left', padding: '2px 5px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 600, color: cfg?.color, background: `${cfg?.color}18`, borderLeft: `2px solid ${cfg?.color}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: T.sans }}>
                      {item.title}
                    </button>
                  )
                })}
                {dayItems.length > 2 && <div style={{ fontSize: 9, color: T.muted, paddingLeft: 2 }}>+{dayItems.length - 2}</div>}
              </div>
            </div>
          )
        })}
      </div>

      {unscheduled.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>No date ({unscheduled.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {unscheduled.map(item => {
              const cfg = BOARD_MAP[item.board]
              return (
                <button key={item.id} onClick={() => onItemClick(item)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.ivory, borderRadius: 10, border: `1px solid ${T.border}`, padding: '10px 14px', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: T.sans }}>
                  <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: cfg?.color }} />
                  <Monogram board={item.board} size={22} />
                  <span style={{ fontSize: 13, color: T.ink, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
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

// ─── MAIN DASHBOARD ───────────────────────────────────────
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
  const [viewMode,     setViewMode]     = useState<'list' | 'calendar'>('list')
  const [dueSoonOnly,  setDueSoonOnly]  = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [activeTag,    setActiveTag]    = useState<string>('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [boardNames,   setBoardNames]   = useState<Record<string, string>>({})

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/'); return }
      setUser(data.user); loadItems(data.user.id)
    })
  }, [])

  useEffect(() => { const seen = localStorage.getItem('cb_tour_complete'); if (!seen) setShowTour(true) }, [])
  useEffect(() => { try { const saved = localStorage.getItem('cb_board_names'); if (saved) setBoardNames(JSON.parse(saved)) } catch {} }, [])

  const loadItems = useCallback(async (uid: string) => {
    const { data, error } = await supabase.from('items').select('*').eq('user_id', uid).order('date', { ascending: true, nullsFirst: false })
    if (error) { setLoading(false); return }
    if (!data || data.length === 0) { router.push('/onboarding'); return }

    const sentinel = data.find(i => i.title?.startsWith('__boards__'))
    setActiveBoards(sentinel ? (DEMO_MODE ? BOARDS.map(b => b.id) : sentinel.title.replace('__boards__','').split(',')) : BOARDS.map(b => b.id))

    const realItems = data.filter(i => !i.title?.startsWith('__boards__'))

    const { data: shares } = await supabase.from('board_shares').select('owner_id, board_type, role').eq('shared_user_id', uid).eq('status', 'active')
    let sharedItems: Item[] = []
    if (shares?.length) {
      for (const share of shares) {
        const { data: ownerItems } = await supabase.from('items').select('*').eq('user_id', share.owner_id).eq('board', share.board_type).not('title', 'like', '__boards__%').order('date', { ascending: true, nullsFirst: false })
        if (ownerItems) sharedItems = [...sharedItems, ...ownerItems.map(i => ({ ...i, _shared: true, _shared_role: share.role, _shared_owner: share.owner_id }))]
      }
    }
    setItems([...realItems, ...sharedItems] as Item[])
    setLoading(false)
  }, [])

  const addItem = async (partial: Partial<Item>, recurRule?: RecurRule | null) => {
    if (!user) return
    if (!isPro && items.length >= FREE_ITEM_LIMIT) { setShowAdd(false); setShowUpgrade(true); return }
    const { data, error } = await supabase.from('items').insert({ ...partial, user_id: user.id }).select().single()
    if (!error && data) {
      const newItem = data as Item
      if (recurRule && partial.date) {
        const { data: ruleData } = await supabase.from('recurring_rules').insert({
          user_id: user.id, board: partial.board, title: partial.title,
          item_template: { notes: partial.notes ?? null, status: partial.status ?? 'todo', checklist: partial.checklist ?? [] },
          frequency: recurRule.frequency, interval_val: recurRule.interval_value,
          day_of_week: recurRule.day_of_week ?? null, next_due: partial.date, end_date: recurRule.end_date ?? null,
        }).select().single()
        if (ruleData) {
          await supabase.from('items').update({ recur_rule_id: ruleData.id }).eq('id', newItem.id)
          ;(newItem as any).recur_rule_id = ruleData.id
          ;(newItem as any)._recurRule = recurRule
        }
      }
      setItems(prev => [...prev, newItem].sort((a,b) => (a.date ?? 'z') > (b.date ?? 'z') ? 1 : -1))
      toast(`Added to ${BOARD_MAP[(partial.board as string)]?.label ?? 'your board'}${recurRule ? ' · repeating' : ''}`)
    }
    setShowAdd(false)
  }

  const updateItem = async (id: string, updates: Partial<Item>) => {
    const { _tags, location, priority, ...dbUpdates } = updates as any
    if (_tags !== undefined) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('item_tags').delete().eq('item_id', id)
        if (_tags.length > 0) await supabase.from('item_tags').insert(_tags.map((tag: string) => ({ item_id: id, user_id: user.id, tag })))
        setItems(prev => prev.map(i => i.id === id ? { ...i, _tags } as any : i))
        if (detail?.id === id) setDetail(prev => prev ? { ...prev, _tags } as any : prev)
      }
      return
    }
    if (location !== undefined) dbUpdates.location = location
    if (priority !== undefined) dbUpdates.priority = priority
    if (Object.keys(dbUpdates).length === 0) return
    const { data, error } = await supabase.from('items').update(dbUpdates).eq('id', id).select().single()
    if (!error && data) {
      const updated = data as Item
      setItems(prev => prev.map(i => i.id === id ? { ...updated, _tags: (i as any)._tags } as any : i))
      setDetail(prev => prev ? { ...updated, _tags: (prev as any)._tags } as any : prev)
      if (dbUpdates.board && dbUpdates.board !== items.find(i => i.id === id)?.board) { toast(`Moved to ${BOARD_MAP[dbUpdates.board as keyof typeof BOARD_MAP]?.label ?? dbUpdates.board}`, 'info'); setDetail(null) }
      if (dbUpdates.status === 'done') { const item = items.find(i => i.id === id); if (item && ((item as any).urgent || item.checklist.length >= 3)) setShowConfetti(true) }
      if (dbUpdates.status) toast(`Status updated to "${updated.status}"`, 'info')
    }
  }

  const deleteItem = async (id: string) => {
    const item = items.find(i => i.id === id)
    await supabase.from('items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id)); setDetail(null)
    toast(`"${item?.title ?? 'Item'}" deleted`, 'info')
  }

  const swipeComplete = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item || item.status === 'done') return
    await supabase.from('items').update({ status: 'done' }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'done' } : i))
    toast(`✓ "${item.title}" marked done`)
    if ((item as any).urgent || item.checklist.length >= 3) setShowConfetti(true)
  }

  const boardLabel = (id: string) => boardNames[id] || BOARD_MAP[id as keyof typeof BOARD_MAP]?.label || id

  const filtered = items.filter(i => {
    const boardMatch   = activeBoard === 'all' || i.board === activeBoard
    const searchMatch  = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.notes?.toLowerCase().includes(search.toLowerCase())
    const dueSoonMatch = !dueSoonOnly || (() => { const n = daysUntil(i.date); return n !== null && n >= 0 && n <= 7 })()
    const priorMatch   = !priorityFilter || (i as any).priority === priorityFilter
    const tagMatch     = !activeTag || ((i as any)._tags ?? []).includes(activeTag)
    return boardMatch && searchMatch && dueSoonMatch && priorMatch && tagMatch
  })

  const dueSoonCount   = items.filter(i => { const n = daysUntil(i.date); return n !== null && n >= 0 && n <= 7 }).length
  const allTagsComp    = [...new Set(items.flatMap(i => (i as any)._tags ?? []))] as string[]
  const thisWeek       = items.filter(i => { const n = daysUntil(i.date); return n !== null && n >= 0 && n <= 7 }).length
  const rsvpNeed       = items.filter(i => i.status === 'rsvp-needed').length
  const openTasks      = items.filter(i => i.status !== 'done').length

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.cream }}>
      <div style={{ fontFamily: T.serif, fontSize: 22, color: T.sub, fontStyle: 'italic' }}>Loading…</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: T.cream, fontFamily: T.sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');
        * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
        .cb-tab:hover { color: rgba(255,255,255,0.85) !important; }
        .cb-row-item:hover { background: #FDFCFA !important; }
        .cb-settings-item:hover { background: ${T.sand} !important; }
      `}</style>

      {/* NAV */}
      <nav style={{ background: T.ink, position: 'sticky', top: 0, zIndex: 30, borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 54, gap: 14 }}>

            {/* Wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[['#8B6B52','rgba(255,255,255,0.25)'],['rgba(255,255,255,0.25)','#6B8A5C']].map((pair, r) => (
                  <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {pair.map((c,i) => <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: c }} />)}
                  </div>
                ))}
              </div>
              <span style={{ fontFamily: T.serif, color: 'white', fontSize: 19, fontWeight: 400, letterSpacing: '0.02em' }}>Clarityboards</span>
            </div>

            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

            {/* Board tabs — flat underline style */}
            <div data-tour="board-tabs" style={{ display: 'flex', alignItems: 'center', flex: 1, overflowX: 'auto' }}>
              <button data-tour="unified-feed" className="cb-tab" onClick={() => setActiveBoard('all')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', border: 'none', borderBottom: activeBoard === 'all' ? '2px solid rgba(255,255,255,0.55)' : '2px solid transparent', cursor: 'pointer', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', fontFamily: T.sans, transition: 'color 0.15s', letterSpacing: '0.01em', background: 'transparent', color: activeBoard === 'all' ? 'white' : 'rgba(255,255,255,0.4)' }}>
                <Layers size={11} strokeWidth={1.5} /> All
              </button>
              {BOARDS.map(b => {
                const locked = !isPro && !activeBoards.includes(b.id)
                const isMeal = (b.id as string) === 'meal'
                const isTravel = (b.id as string) === 'travel'
                const isWishlist = (b.id as string) === 'wishlist'
                const isActive = activeBoard === b.id
                return (
                  <button key={b.id} className="cb-tab"
                    onClick={() => { if (locked) { setShowUpgrade(true); return } if (isMeal) { router.push('/settings/meal'); return } if (isTravel) { router.push('/settings/travel'); return } if (isWishlist) { router.push('/settings/wishlist'); return } setActiveBoard(b.id) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', border: 'none', borderBottom: isActive ? `2px solid ${b.color}` : '2px solid transparent', cursor: 'pointer', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', fontFamily: T.sans, transition: 'color 0.15s', letterSpacing: '0.01em', background: 'transparent', color: isActive ? 'white' : locked ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.42)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: locked ? 'rgba(255,255,255,0.2)' : b.color, flexShrink: 0 }} />
                    {boardLabel(b.id).replace('Board', '')}
                  </button>
                )
              })}
            </div>

            {/* Right actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              <NavIconBtn onClick={() => setSearchOpen(true)} title="Search (⌘K)"><Search size={14} strokeWidth={1.5} /></NavIconBtn>
              <NavIconBtn onClick={() => setShowUpgrade(true)} title="Pro">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="8,1 10,6 15,6 11,10 12.5,15 8,12 3.5,15 5,10 1,6 6,6"/></svg>
              </NavIconBtn>
              <NavIconBtn onClick={() => { localStorage.removeItem('cb_tour_complete'); setShowTour(true) }} title="Help">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5"/><path d="M6 6a2 2 0 114 0c0 1.5-2 2-2 3.5"/><circle cx="8" cy="12.5" r="0.6" fill="currentColor"/></svg>
              </NavIconBtn>

              {/* Settings */}
              <div style={{ position: 'relative' }}>
                <NavIconBtn onClick={() => setShowSettings(s => !s)} title="Settings"><Settings size={14} strokeWidth={1.5} /></NavIconBtn>
                {showSettings && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowSettings(false)} />
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 240, background: T.ivory, borderRadius: 8, boxShadow: '0 4px 24px rgba(26,23,20,0.14)', border: `0.5px solid ${T.border}`, zIndex: 50, overflow: 'hidden' }}>
                      <div style={{ padding: '8px 14px 4px', fontSize: 9, fontWeight: 600, color: T.sub, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Boards</div>
                      {[
                        { href: '/settings/meal',     label: 'MealBoard',    icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v12M4 4c0-2 1.5-2 2-2M12 4c0-2-1.5-2-2-2M3 6h10"/></svg> },
                        { href: '/settings/travel',   label: 'TravelBoard',  icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12l4-8 4 8M14 4l-2 8"/><path d="M6.5 9h3"/></svg> },
                        { href: '/settings/wishlist', label: 'WishlistBoard',icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="8,2 9.5,6 14,6 10.5,9 11.5,13 8,11 4.5,13 5.5,9 2,6 6.5,6"/></svg> },
                      ].map(item => (
                        <a key={item.href} href={item.href} onClick={() => setShowSettings(false)} className="cb-settings-item"
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', fontSize: 13, fontWeight: 400, color: T.ink, textDecoration: 'none', transition: 'background 0.1s' }}>
                          <span style={{ color: T.sub, display: 'flex', width: 16, justifyContent: 'center' }}>{item.icon}</span>{item.label}
                        </a>
                      ))}
                      <div style={{ height: '0.5px', background: T.border, margin: '4px 0' }} />
                      <div style={{ padding: '4px 14px', fontSize: 9, fontWeight: 600, color: T.sub, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Integrations</div>
                      {[
                        { href: '/settings/gcal',     label: 'Google Calendar', icon: <Calendar size={13} strokeWidth={1.5} /> },
                        { href: '/settings/ical',     label: 'Calendar Export', icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 1v3M11 1v3M2 7h12"/></svg> },
                        { href: '/settings/phone',    label: 'SMS Forwarding',  icon: <Phone size={13} strokeWidth={1.5} /> },
                        { href: '/settings/zapier',   label: 'Zapier',          icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v4M8 10v4M2 8h4M10 8h4"/></svg> },
                        { href: '/settings/pinterest',label: 'Pinterest Boards',icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M6 10.5c.4-1.5.7-3 1-4.5M7 6c.5-1.5 2.5-2 3 0s-1 3-2.5 2.5"/></svg> },
                        { href: '/settings/watch',    label: 'Watch & Alert',   icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg> },
                        { href: '/settings/ical-subscriptions', label: 'Subscribe Calendars', icon: <RefreshCw size={13} strokeWidth={1.5} /> },
                      ].map(item => (
                        <a key={item.href} href={item.href} onClick={() => setShowSettings(false)} className="cb-settings-item"
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', fontSize: 13, fontWeight: 400, color: T.ink, textDecoration: 'none', transition: 'background 0.1s' }}>
                          <span style={{ color: T.sub, display: 'flex', width: 16, justifyContent: 'center' }}>{item.icon}</span>{item.label}
                        </a>
                      ))}
                      <div style={{ height: '0.5px', background: T.border, margin: '4px 0' }} />
                      <div style={{ padding: '4px 14px', fontSize: 9, fontWeight: 600, color: T.sub, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Account</div>
                      {[
                        { href: '/settings/boards',       label: 'Rename Boards',   icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 3l2 2-6 6-2.5.5.5-2.5L11 3z"/></svg> },
                        { href: '/settings/notifications', label: 'Notifications',  icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2a4 4 0 014 4c0 4 2 5 2 5H2s2-1 2-5a4 4 0 014-4z"/><path d="M6.5 13a1.5 1.5 0 003 0"/></svg> },
                        { href: '/settings/export',        label: 'Export & Connect',icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 10V2M5 5l3-3 3 3M4 10v4h8v-4"/></svg> },
                        { href: '/settings/language',      label: t('language'),    icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 2c-1.5 2-1.5 8 0 12M8 2c1.5 2 1.5 8 0 12M2 8h12"/></svg> },
                      ].map(item => (
                        <a key={item.href} href={item.href} onClick={() => setShowSettings(false)} className="cb-settings-item"
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', fontSize: 13, fontWeight: 400, color: T.ink, textDecoration: 'none', transition: 'background 0.1s' }}>
                          <span style={{ color: T.sub, display: 'flex', width: 16, justifyContent: 'center' }}>{item.icon}</span>{item.label}
                        </a>
                      ))}
                      <div style={{ height: '0.5px', background: T.border }} />
                      <button onClick={() => { setShowSettings(false); signOut() }} className="cb-settings-item"
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13, fontWeight: 400, color: '#A32D2D', background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontFamily: T.sans, transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FDF6F3'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <LogOut size={13} strokeWidth={1.5} /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          {searchOpen && (
            <div style={{ paddingBottom: 10 }}>
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchPlaceholder')}
                style={{ width: '100%', background: 'rgba(255,255,255,0.08)', color: 'white', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '9px 14px', fontSize: 13, outline: 'none', fontFamily: T.sans, fontWeight: 300 }} />
            </div>
          )}
        </div>
      </nav>

      {/* STATS STRIP */}
      <div style={{ background: T.ivory, borderBottom: `0.5px solid ${T.border}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, height: 50, overflowX: 'auto' }}>
            {[
              { label: t('thisWeek'),    value: thisWeek,     color: T.accent },
              { label: t('rsvpsNeeded'),value: rsvpNeed,      color: '#8B6914' },
              { label: t('openItems'),   value: openTasks,    color: '#3C6B5A' },
              { label: t('totalItems'),  value: items.length, color: T.sub },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexShrink: 0 }}>
                <span style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 300, color: s.color, lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: 11, color: T.sub, fontWeight: 300, letterSpacing: '0.01em' }}>{s.label}</span>
              </div>
            ))}
            <div style={{ width: '0.5px', height: 18, background: T.border, flexShrink: 0 }} />
            {dueSoonCount > 0 && (
              <button onClick={() => setDueSoonOnly(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 4, border: `0.5px solid ${dueSoonOnly ? T.accent : T.border}`, background: dueSoonOnly ? T.accent : 'transparent', color: dueSoonOnly ? 'white' : T.accent, fontSize: 11, fontWeight: 500, cursor: 'pointer', flexShrink: 0, fontFamily: T.sans, transition: 'all 0.15s' }}>
                <Bell size={9} strokeWidth={1.5} /> {dueSoonCount} due soon {dueSoonOnly && '×'}
              </button>
            )}
            {[{ v: 'high', label: 'High', dot: '#E24B4A' }, { v: 'medium', label: 'Med', dot: '#EF9F27' }, { v: 'low', label: 'Low', dot: '#639922' }].map(p => (
              <button key={p.v} onClick={() => setPriorityFilter(v => v === p.v ? '' : p.v)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 4, border: `0.5px solid ${priorityFilter === p.v ? T.ink : T.border}`, background: priorityFilter === p.v ? T.ink : 'transparent', color: priorityFilter === p.v ? 'white' : T.sub, fontSize: 11, fontWeight: 500, cursor: 'pointer', flexShrink: 0, fontFamily: T.sans, transition: 'all 0.15s' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: priorityFilter === p.v ? 'white' : p.dot, flexShrink: 0 }} />
                {p.label}{priorityFilter === p.v && ' ×'}
              </button>
            ))}
            {allTagsComp.slice(0, 4).map(tag => (
              <button key={tag} onClick={() => setActiveTag(tg => tg === tag ? '' : tag)}
                style={{ padding: '4px 10px', borderRadius: 4, border: `0.5px solid ${activeTag === tag ? T.ink : T.border}`, background: activeTag === tag ? T.ink : 'transparent', color: activeTag === tag ? 'white' : T.inkMid, fontSize: 11, fontWeight: 500, cursor: 'pointer', flexShrink: 0, fontFamily: T.sans, transition: 'all 0.15s' }}>
                #{tag}{activeTag === tag && ' ×'}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', border: `0.5px solid ${T.border}`, borderRadius: 4, overflow: 'hidden' }}>
                {([['list', <List size={12} strokeWidth={1.5} />], ['calendar', <LayoutGrid size={12} strokeWidth={1.5} />]] as const).map(([v, icon]) => (
                  <button key={v} onClick={() => setViewMode(v as any)}
                    style={{ padding: '5px 9px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s', background: viewMode === v ? T.ink : 'transparent', color: viewMode === v ? 'white' : T.sub }}>
                    {icon}
                  </button>
                ))}
              </div>
              {user?.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="" style={{ width: 26, height: 26, borderRadius: '50%', border: `0.5px solid ${T.border}` }} />
              )}
              <span style={{ fontSize: 12, color: T.sub, fontWeight: 300 }}>{user?.user_metadata?.full_name?.split(' ')[0] ?? t('welcome')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px 120px' }}>
        {activeBoard !== 'all' && (() => {
          const cfg = BOARD_MAP[activeBoard as keyof typeof BOARD_MAP]
          return (
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 20, borderBottom: `0.5px solid ${T.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 6, background: T.sand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: cfg?.color }} />
                </div>
                <div>
                  <div style={{ fontFamily: T.serif, fontSize: 28, color: T.ink, fontWeight: 400, letterSpacing: '0.01em', lineHeight: 1.1 }}>{boardLabel(activeBoard)}</div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 3, fontWeight: 300 }}>{cfg?.tagline}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={`/settings/export?board=${activeBoard}`} data-tour="export-button"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 4, border: `0.5px solid ${T.border}`, color: T.inkMid, fontSize: 12, fontWeight: 500, textDecoration: 'none', background: 'white', fontFamily: T.sans }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 10V2M5 5l3-3 3 3M4 10v4h8v-4"/></svg> Export
                </a>
                <button onClick={() => setShareBoard(activeBoard)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 4, border: `0.5px solid ${T.border}`, color: T.inkMid, fontSize: 12, fontWeight: 500, background: 'white', cursor: 'pointer', fontFamily: T.sans }}>
                  <Share2 size={12} strokeWidth={1.5} /> {t('shareBoard')}
                </button>
              </div>
            </div>
          )
        })()}

        {viewMode === 'calendar' ? (
          <CalendarView items={filtered} onItemClick={setDetail} />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 0' }}>
            <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 300, color: T.sub, fontStyle: 'italic', marginBottom: 8, letterSpacing: '0.01em' }}>Nothing here yet</div>
            <div style={{ fontSize: 13, color: T.sub, fontWeight: 300, marginBottom: 28 }}>{t('noItemsDesc')}</div>
            <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', borderRadius: 4, border: 'none', background: T.ink, color: 'white', fontFamily: T.sans, fontWeight: 500, fontSize: 13, cursor: 'pointer', letterSpacing: '0.02em' }}>Add your first item</button>
          </div>
        ) : (
          <div style={{ border: `0.5px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {filtered.map((item, index) => (
              <ItemCard key={item.id} item={item} onClick={() => setDetail(item)} onSwipeComplete={() => swipeComplete(item.id)} isFirst={index === 0} />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button data-tour="add-button" onClick={() => setShowAdd(true)}
        style={{ position: 'fixed', right: 20, width: 46, height: 46, borderRadius: 6, background: T.ink, color: 'white', border: 'none', boxShadow: '0 2px 16px rgba(26,23,20,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, bottom: 'max(76px, calc(60px + env(safe-area-inset-bottom)))', transition: 'transform 0.15s, box-shadow 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 4px 22px rgba(26,23,20,0.35)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(26,23,20,0.25)' }}>
        <Plus size={20} strokeWidth={1.75} />
      </button>

      {/* BOTTOM NAV */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: T.ink, borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: 52, maxWidth: 960, margin: '0 auto' }}>
          <button onClick={() => setActiveBoard('all')}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, height: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Layers size={15} strokeWidth={1.5} color={activeBoard === 'all' ? 'white' : 'rgba(255,255,255,0.35)'} />
            <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.03em', color: activeBoard === 'all' ? 'white' : 'rgba(255,255,255,0.35)' }}>All</span>
          </button>
          {BOARDS.map(b => {
            const locked = !isPro && !activeBoards.includes(b.id)
            const isMeal = (b.id as string) === 'meal'
            const isTravel = (b.id as string) === 'travel'
            const isWishlist = (b.id as string) === 'wishlist'
            const isActive = activeBoard === b.id
            return (
              <button key={b.id}
                onClick={() => { if (locked) { setShowUpgrade(true); return } if (isMeal) { router.push('/settings/meal'); return } if (isTravel) { router.push('/settings/travel'); return } if (isWishlist) { router.push('/settings/wishlist'); return } setActiveBoard(b.id) }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, height: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: locked ? 'rgba(255,255,255,0.15)' : isActive ? b.color : 'rgba(255,255,255,0.3)', transition: 'all 0.15s' }} />
                <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.03em', color: isActive ? 'white' : locked ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.35)', maxWidth: 44, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {boardLabel(b.id).replace('Board','')}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* MODALS */}
      {showAdd     && <AddModal defaultBoard={activeBoard === 'all' ? 'event' : activeBoard} onSave={(item, rule) => addItem(item, rule)} onClose={() => setShowAdd(false)} />}
      {detail      && <DetailModal item={detail} onUpdate={u => updateItem(detail.id, u)} onDelete={() => deleteItem(detail.id)} onClose={() => setDetail(null)} boardNames={boardNames} />}
      {shareBoard  && <ShareModal board={shareBoard} onClose={() => setShareBoard(null)} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} itemCount={items.length} />}
      {showConfetti && <ConfettiOverlay onDone={() => setShowConfetti(false)} />}

      {showTour && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <OnboardingTour onComplete={() => { localStorage.setItem('cb_tour_complete', '1'); setShowTour(false) }} />
        </div>
      )}

      {searchOpen && (
        <GlobalSearch onSelectItem={(board, itemId) => {
          setActiveBoard(board as any)
          setTimeout(() => { const item = items.find(i => i.id === itemId); if (item) setDetail(item) }, 100)
        }} onClose={() => setSearchOpen(false)} />
      )}

      <PWAManager />
      <KeyboardShortcut onSearch={() => setSearchOpen(true)} />
    </div>
  )
}

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
  cream:   '#FAF9F7',
  ivory:   '#FFFEF9',
  sand:    '#F2EDE6',
  border:  '#EDE9E3',
  muted:   '#C8B8A8',
  sub:     '#9C8B7A',
  ink:     '#2C2318',
  serif:   "'Cormorant Garamond', Georgia, serif",
  sans:    "'DM Sans', system-ui, sans-serif",
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
    'accepted':    { bg: '#D5F0E0', text: '#1E6B40' },
    'declined':    { bg: '#FADBD8', text: '#8B2020' },
    'in-progress': { bg: '#D6EAF8', text: '#1A5276' },
    'submitted':   { bg: '#E8DAEF', text: '#5B2C6F' },
    'applied':     { bg: '#D4E6F1', text: '#1A4F72' },
    'done':        { bg: '#EAEDED', text: '#717D7E' },
    'todo':        { bg: '#F2F3F4', text: '#717D7E' },
  }
  const label = cfg?.statuses.find(s => s.value === status)?.label ?? status
  const style = map[status] ?? { bg: '#F2F3F4', text: '#717D7E' }
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
      background: style.bg, color: style.text, letterSpacing: '0.03em',
      fontFamily: T.sans, whiteSpace: 'nowrap',
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
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
      {/* Swipe reveal */}
      <div style={{ position: 'absolute', inset: '0 auto 0 0', display: 'flex', alignItems: 'center', paddingLeft: 16, background: '#5C8B6A', width: Math.max(swipeX, 0), opacity: swipeX > 10 ? 1 : 0, borderRadius: 12 }}>
        <Check size={16} color="white" strokeWidth={2.5} />
      </div>

      {/* Card */}
      <div onClick={() => { if (swipeX < 5) onClick() }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{
          background: T.ivory, borderRadius: 12,
          border: `1px solid ${T.border}`,
          display: 'flex', overflow: 'hidden', cursor: 'pointer',
          transform: `translateX(${swipeX}px)`,
          transition: swipeX === 0 ? 'transform 0.25s ease, opacity 0.3s, box-shadow 0.2s' : 'none',
          opacity: isDone ? 0.55 : swiped ? 0 : 1,
          boxShadow: '0 1px 4px rgba(44,35,24,0.06)',
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(44,35,24,0.1)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(44,35,24,0.06)')}
      >
        {/* Board color bar */}
        <div style={{ width: 3, flexShrink: 0, background: cfg?.color }} />

        <div style={{ flex: 1, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <Monogram board={item.board} size={24} />
              <span style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 13, color: isDone ? T.muted : T.ink, textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.title}
              </span>
              {(item as any)._shared && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: T.sand, color: T.sub, flexShrink: 0 }}>shared</span>
              )}
              {(item as any).recur_rule_id && (
                <span style={{ flexShrink: 0 }}><RefreshCw size={10} color={T.muted} /></span>
              )}
            </div>
            <span {...(isFirst ? { 'data-tour': 'status-badge' } : {})}>
              <StatusPill status={item.status} board={item.board} />
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            {item.date && (
              <span style={{ fontSize: 11, color: urgencyColor(item.date), fontWeight: daysUntil(item.date) !== null && (daysUntil(item.date) ?? 99) <= 7 ? 600 : 400 }}>
                {urgencyLabel(item.date, t)}
              </span>
            )}
            {item.checklist.length > 0 && (
              <span {...(isFirst ? { 'data-tour': 'checklist' } : {})}
                style={{ fontSize: 11, color: T.sub, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckSquare size={11} />
                {item.checklist.filter(c => c.done).length}/{item.checklist.length}
              </span>
            )}
          </div>

          {pct !== null && (
            <div style={{ marginTop: 8, height: 2, background: T.sand, borderRadius: 1 }}>
              <div style={{ height: '100%', borderRadius: 1, background: cfg?.color, width: `${pct}%`, transition: 'width 0.3s' }} />
            </div>
          )}
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ background: T.ink, position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 58, gap: 16 }}>
            {/* Wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[['#C17A5A','rgba(255,255,255,0.3)'],['rgba(255,255,255,0.3)','#8B9B6A']].map((pair, r) => (
                  <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {pair.map((c,i) => <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: c }} />)}
                  </div>
                ))}
              </div>
              <span style={{ fontFamily: T.serif, color: 'white', fontSize: 20, fontWeight: 500, letterSpacing: '0.02em', display: 'none' }} className="sm-visible">Clarityboards</span>
            </div>

            {/* Board tabs */}
            <div data-tour="board-tabs" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflowX: 'auto' }}>
              <button data-tour="unified-feed" onClick={() => setActiveBoard('all')}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: T.sans, transition: 'all 0.15s',
                  background: activeBoard === 'all' ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: activeBoard === 'all' ? 'white' : 'rgba(255,255,255,0.45)',
                }}>
                <Layers size={12} /> All
              </button>
              {BOARDS.map(b => {
                const locked = !isPro && !activeBoards.includes(b.id)
                const isMeal = (b.id as string) === 'meal'
                return (
                  <button key={b.id} onClick={() => { if (locked) { setShowUpgrade(true); return } if (isMeal) { router.push('/settings/meal'); return } setActiveBoard(b.id) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: T.sans, transition: 'all 0.15s',
                      background: activeBoard === b.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                      color: activeBoard === b.id ? 'white' : locked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
                    }}>
                    <span style={{ width: 16, height: 16, borderRadius: 4, background: locked ? 'rgba(255,255,255,0.15)' : b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontFamily: T.serif, color: 'white', fontWeight: 600 }}>
                      {locked ? '🔒' : b.letter}
                    </span>
                    {boardLabel(b.id)}
                  </button>
                )
              })}
            </div>

            {/* Right actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <NavIconBtn onClick={() => setSearchOpen(true)} title="Search (⌘K)"><Search size={15} /></NavIconBtn>
              <NavIconBtn onClick={() => setShowUpgrade(true)} title="Pro">⭐</NavIconBtn>
              <NavIconBtn onClick={() => { localStorage.removeItem('cb_tour_complete'); setShowTour(true) }} title="Tour">?</NavIconBtn>

              {/* Settings */}
              <div style={{ position: 'relative' }}>
                <NavIconBtn onClick={() => setShowSettings(s => !s)} title="Settings"><Settings size={15} /></NavIconBtn>
                {showSettings && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowSettings(false)} />
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 220, background: T.ivory, borderRadius: 14, boxShadow: '0 8px 32px rgba(44,35,24,0.18)', border: `1px solid ${T.border}`, zIndex: 50, overflow: 'hidden' }}>
                      <div style={{ padding: '8px 14px 6px', fontSize: 9, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: `1px solid ${T.border}` }}>Settings</div>
                      {[
                        { href: '/settings/sharing',           icon: <Share2 size={13} />,   label: 'Board Sharing' },
                        { href: '/settings/phone',             icon: <Phone size={13} />,    label: 'SMS Forwarding' },
                        { href: '/settings/ical',              icon: <Calendar size={13} />, label: 'Calendar Export' },
                        { href: '/settings/ical-subscriptions',icon: <RefreshCw size={13} />,label: 'Subscribe to Calendars' },
                        { href: '/settings/gcal',              icon: '📅',                  label: 'Google Calendar Sync' },
                        { href: '/settings/boards',            icon: '✏️',                  label: 'Rename Boards' },
                        { href: '/settings/export',            icon: '📤',                  label: 'Export & Connect' },
                        { href: '/settings/zapier',            icon: '⚡',                  label: 'Zapier Integration' },
                        { href: '/settings/pinterest',         icon: '📌',                  label: 'Pinterest Boards' },
                        { href: '/settings/watch',             icon: '👁️',                 label: 'Watch & Alert' },
                        { href: '/settings/notifications',     icon: '🔔',                  label: 'Notifications' },
                        { href: '/settings/templates',         icon: '📋',                  label: 'Templates' },
                        { href: '/settings/language',          icon: '🌐',                  label: t('language') },
                      ].map(item => (
                        <a key={item.href} href={item.href} onClick={() => setShowSettings(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13, color: T.ink, textDecoration: 'none', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = T.sand}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <span style={{ color: T.sub, display: 'flex', fontSize: 13 }}>{item.icon}</span>
                          {item.label}
                        </a>
                      ))}
                      <div style={{ borderTop: `1px solid ${T.border}` }}>
                        <button onClick={() => { setShowSettings(false); signOut() }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13, color: '#C0392B', background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontFamily: T.sans }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FDF6F3'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <LogOut size={13} /> Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <NavIconBtn onClick={signOut} title="Sign out" className="sm-hidden"><LogOut size={15} /></NavIconBtn>
            </div>
          </div>

          {/* Search bar */}
          {searchOpen && (
            <div style={{ paddingBottom: 10 }}>
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 13, outline: 'none', fontFamily: T.sans }}
              />
            </div>
          )}
        </div>
      </nav>

      {/* ── STATS STRIP ── */}
      <div style={{ background: T.ivory, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, height: 52, overflowX: 'auto' }}>
            {[
              { label: t('thisWeek'),   value: thisWeek,       color: '#C17A5A' },
              { label: t('rsvpsNeeded'),value: rsvpNeed,       color: '#8B6914' },
              { label: t('openItems'),  value: openTasks,      color: '#3C6B5A' },
              { label: t('totalItems'), value: items.length,   color: T.sub },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, color: s.color }}>{s.value}</span>
                <span style={{ fontSize: 11, color: T.sub, lineHeight: 1.3 }}>{s.label}</span>
              </div>
            ))}

            {/* Divider */}
            <div style={{ width: 1, height: 20, background: T.border, flexShrink: 0 }} />

            {/* Due soon filter */}
            {dueSoonCount > 0 && (
              <button onClick={() => setDueSoonOnly(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: `1px solid ${dueSoonOnly ? '#C17A5A' : T.border}`, background: dueSoonOnly ? '#C17A5A' : 'transparent', color: dueSoonOnly ? 'white' : '#C17A5A', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0, fontFamily: T.sans, transition: 'all 0.15s' }}>
                <Bell size={10} /> {dueSoonCount} due soon {dueSoonOnly && '×'}
              </button>
            )}

            {/* Priority filters */}
            {[{ v: 'high', e: '🔴' }, { v: 'medium', e: '🟡' }, { v: 'low', e: '🟢' }].map(p => (
              <button key={p.v} onClick={() => setPriorityFilter(v => v === p.v ? '' : p.v)}
                style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${priorityFilter === p.v ? T.ink : T.border}`, background: priorityFilter === p.v ? T.ink : 'transparent', color: priorityFilter === p.v ? 'white' : T.sub, fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0, fontFamily: T.sans, transition: 'all 0.15s' }}>
                {p.e} {priorityFilter === p.v && '×'}
              </button>
            ))}

            {/* Tag filters */}
            {allTagsComp.slice(0, 4).map(tag => (
              <button key={tag} onClick={() => setActiveTag(tg => tg === tag ? '' : tag)}
                style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${activeTag === tag ? T.ink : T.border}`, background: activeTag === tag ? T.ink : T.sand, color: activeTag === tag ? 'white' : T.ink, fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0, fontFamily: T.sans }}>
                #{tag} {activeTag === tag && '×'}
              </button>
            ))}

            {/* View toggle */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, background: T.sand, borderRadius: 10, padding: 3, flexShrink: 0 }}>
              {[['list', <List size={13} />], ['calendar', <LayoutGrid size={13} />]].map(([v, icon]) => (
                <button key={v as string} onClick={() => setViewMode(v as any)}
                  style={{ padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s',
                    background: viewMode === v ? T.ivory : 'transparent',
                    color: viewMode === v ? T.ink : T.sub,
                    boxShadow: viewMode === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}>
                  {icon}
                </button>
              ))}
            </div>

            {/* User avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {user?.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${T.border}` }} />
              )}
              <span style={{ fontSize: 12, color: T.sub }}>
                {user?.user_metadata?.full_name?.split(' ')[0] ?? t('welcome')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px 120px' }}>

        {/* Board header when filtered */}
        {activeBoard !== 'all' && (() => {
          const cfg = BOARD_MAP[activeBoard as keyof typeof BOARD_MAP]
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Monogram board={activeBoard} size={48} />
                <div>
                  <div style={{ fontFamily: T.serif, fontSize: 28, color: T.ink, fontWeight: 500 }}>{boardLabel(activeBoard)}</div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{cfg?.tagline}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={`/settings/export?board=${activeBoard}`} data-tour="export-button"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, border: `1px solid ${T.border}`, color: T.sub, fontSize: 12, fontWeight: 600, textDecoration: 'none', background: T.ivory, fontFamily: T.sans }}>
                  📤 Export
                </a>
                <button onClick={() => setShareBoard(activeBoard)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, border: `1px solid ${T.border}`, color: T.sub, fontSize: 12, fontWeight: 600, background: T.ivory, cursor: 'pointer', fontFamily: T.sans }}>
                  <Share2 size={13} /> {t('shareBoard')}
                </button>
              </div>
            </div>
          )
        })()}

        {/* Content */}
        {viewMode === 'calendar' ? (
          <CalendarView items={filtered} onItemClick={setDetail} />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div style={{ fontFamily: T.serif, fontSize: 28, color: T.sub, fontStyle: 'italic', marginBottom: 8 }}>Nothing here yet</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 24 }}>{t('noItemsDesc')}</div>
            <button onClick={() => setShowAdd(true)} style={primaryBtn(T.ink)}>Add your first item</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            {filtered.map((item, index) => (
              <ItemCard key={item.id} item={item} onClick={() => setDetail(item)} onSwipeComplete={() => swipeComplete(item.id)} isFirst={index === 0} />
            ))}
          </div>
        )}
      </main>

      {/* ── FAB ── */}
      <button data-tour="add-button" onClick={() => setShowAdd(true)}
        style={{ position: 'fixed', right: 20, width: 52, height: 52, borderRadius: '50%', background: T.ink, color: 'white', border: 'none', boxShadow: '0 4px 20px rgba(44,35,24,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, bottom: 'max(80px, calc(64px + env(safe-area-inset-bottom)))', transition: 'transform 0.2s, box-shadow 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(44,35,24,0.4)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(44,35,24,0.3)' }}
      >
        <Plus size={22} />
      </button>

      {/* ── BOTTOM NAV (mobile) ── */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: T.ink, borderTop: `1px solid rgba(255,255,255,0.06)`, paddingBottom: 'env(safe-area-inset-bottom, 0px)', display: 'flex' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: 56 }}>
          <button onClick={() => setActiveBoard('all')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, height: '100%', background: 'none', border: 'none', cursor: 'pointer', color: activeBoard === 'all' ? 'white' : 'rgba(255,255,255,0.35)' }}>
            <Layers size={17} />
            <span style={{ fontSize: 9, fontWeight: 600 }}>All</span>
          </button>
          {BOARDS.map(b => {
            const locked = !isPro && !activeBoards.includes(b.id)
            const isMeal = (b.id as string) === 'meal'
            return (
              <button key={b.id} onClick={() => { if (locked) { setShowUpgrade(true); return } if (isMeal) { router.push('/settings/meal'); return } setActiveBoard(b.id) }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, height: '100%', background: 'none', border: 'none', cursor: 'pointer', color: activeBoard === b.id ? 'white' : locked ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.35)' }}>
                <span style={{ width: 18, height: 18, borderRadius: 4, background: locked ? 'rgba(255,255,255,0.1)' : b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontFamily: T.serif, color: 'white', fontWeight: 600 }}>
                  {locked ? '🔒' : b.letter}
                </span>
                <span style={{ fontSize: 9, fontWeight: 600, maxWidth: 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{boardLabel(b.id).replace('Board','')}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* ── MODALS ── */}
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

// ─── Shared sub-components ────────────────────────────────
function BottomSheet({ children, onClose, maxWidth = 480 }: { children: React.ReactNode; onClose: () => void; maxWidth?: number }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,35,24,0.55)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: T.ivory, width: '100%', maxWidth, borderRadius: '20px 20px 0 0', padding: '10px 24px 40px', maxHeight: '92dvh', overflowY: 'auto', paddingBottom: 'max(40px, env(safe-area-inset-bottom, 40px))' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border, margin: '0 auto 20px' }} />
        {children}
      </div>
    </div>
  )
}

function NavIconBtn({ children, onClick, title, className }: { children: React.ReactNode; onClick: () => void; title?: string; className?: string }) {
  return (
    <button onClick={onClick} title={title}
      style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.15s', fontFamily: T.sans }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
    >{children}</button>
  )
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4, fontFamily: T.sans, ...style }}>
      {children}
    </div>
  )
}

// Shared style helpers
const sheetInput: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: 10, border: `1px solid ${T.border}`,
  fontSize: 13, fontFamily: T.sans, color: T.ink, marginBottom: 10, outline: 'none', background: T.ivory,
}
const primaryBtn = (bg: string): React.CSSProperties => ({
  width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none',
  background: bg, color: 'white', fontWeight: 700, fontSize: 13,
  cursor: 'pointer', fontFamily: T.sans,
})
const ghostBtn: React.CSSProperties = {
  flex: 1, padding: '12px', borderRadius: 12, border: `1px solid ${T.border}`,
  background: 'transparent', color: T.sub, fontWeight: 600, fontSize: 13,
  cursor: 'pointer', fontFamily: T.sans,
}
const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: T.muted,
  padding: 0, lineHeight: 1, flexShrink: 0,
}

function KeyboardShortcut({ onSearch }: { onSearch: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); onSearch() } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onSearch])
  return null
}

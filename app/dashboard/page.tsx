'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Item, ChecklistItem } from '@/lib/supabase'
import { BOARDS, BOARD_MAP } from '@/lib/boards'
import { getSeedItems } from '@/lib/seeds'
import { User } from '@supabase/supabase-js'
import {
  Plus, LogOut, Share2, X, Check, ChevronDown, ChevronUp,
  Calendar, Bell, Search, CheckSquare, Layers
} from 'lucide-react'

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
const urgencyLabel = (d: string | null) => {
  const n = daysUntil(d)
  if (n === null) return ''
  if (n < 0)  return `${Math.abs(n)}d overdue`
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n <= 7) return `${n}d away`
  return fmt(d)
}
const progress = (cl: ChecklistItem[]) =>
  cl.length === 0 ? null : Math.round((cl.filter(c => c.done).length / cl.length) * 100)

// ── Status pill ───────────────────────────────────────────
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

// ── Share Modal (placeholder) ─────────────────────────────
function ShareModal({ board, onClose }: { board: string; onClose: () => void }) {
  const cfg = BOARD_MAP[board as keyof typeof BOARD_MAP]
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
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
  )
}

// ── Add Item Modal ────────────────────────────────────────
function AddModal({ defaultBoard, onSave, onClose }: {
  defaultBoard: string
  onSave: (item: Partial<Item>) => void
  onClose: () => void
}) {
  const [board,  setBoard]  = useState(defaultBoard)
  const [title,  setTitle]  = useState('')
  const [date,   setDate]   = useState('')
  const [notes,  setNotes]  = useState('')
  const cfg = BOARD_MAP[board as keyof typeof BOARD_MAP]

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#1A2B3C]">Add Item</h2>
          <button onClick={onClose} className="text-[#5A7A94] hover:text-[#1A2B3C]"><X size={20} /></button>
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
              onSave({ board: board as Item['board'], title: title.trim(), date: date || null, notes: notes || null, status: cfg?.statuses[0]?.value ?? 'todo', checklist: [] })
            }}
            className="flex-1 py-2.5 rounded-xl text-white font-medium transition-colors text-sm"
            style={{ background: cfg?.color }}
          >
            Add Item
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Item Detail Modal ─────────────────────────────────────
function DetailModal({ item, onUpdate, onDelete, onClose }: {
  item: Item
  onUpdate: (updates: Partial<Item>) => void
  onDelete: () => void
  onClose: () => void
}) {
  const cfg = BOARD_MAP[item.board]
  const [newTask, setNewTask]         = useState('')
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const pct = progress(item.checklist)

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
  const saveEdit = (id: string) => {
    if (!editingText.trim()) return
    const updated = item.checklist.map(c => c.id === id ? { ...c, text: editingText.trim() } : c)
    onUpdate({ checklist: updated })
    setEditingId(null)
  }
  const deleteTask = (id: string) => {
    onUpdate({ checklist: item.checklist.filter(c => c.id !== id) })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-2xl px-6 pt-5 pb-4 border-b border-[#EBF3FB]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Monogram board={item.board} size={36} />
              <div>
                <div className="font-semibold text-[#1A2B3C] text-base leading-tight">{item.title}</div>
                <div className="text-xs text-[#5A7A94] mt-0.5">{cfg?.label}</div>
              </div>
            </div>
            <button onClick={onClose} className="text-[#5A7A94] hover:text-[#1A2B3C] flex-shrink-0"><X size={20} /></button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusPill status={item.status} board={item.board} />
            {item.date && (
              <span className={`text-xs flex items-center gap-1 ${urgencyClass(item.date)}`}>
                <Calendar size={12} />
                {urgencyLabel(item.date)} · {fmt(item.date)}
              </span>
            )}
          </div>

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

          {item.notes && (
            <div>
              <div className="text-xs font-semibold text-[#5A7A94] uppercase tracking-wide mb-1">Notes</div>
              <div className="text-sm text-[#1A2B3C] bg-[#EBF3FB] rounded-xl px-4 py-3 whitespace-pre-line">{item.notes}</div>
            </div>
          )}

          {/* Checklist — add, edit, delete */}
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
                      onDoubleClick={() => startEdit(c)}
                      title="Double-click to edit">
                      {c.text}
                    </span>
                  )}

                  {editingId !== c.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => startEdit(c)}
                        className="w-6 h-6 rounded flex items-center justify-center text-[#5A7A94] hover:text-[#1B4F8A] hover:bg-[#EBF3FB] transition-all"
                        title="Edit task">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => deleteTask(c.id)}
                        className="w-6 h-6 rounded flex items-center justify-center text-[#5A7A94] hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Delete task">
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
              <p className="text-xs text-[#5A7A94] mt-1">Hover to edit or delete · Double-click to edit inline</p>
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

// ── Item Card ─────────────────────────────────────────────
function ItemCard({ item, onClick }: { item: Item; onClick: () => void }) {
  const cfg = BOARD_MAP[item.board]
  const pct = progress(item.checklist)

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-[#EBF3FB] hover:border-[#D4E6F1] hover:shadow-md transition-all cursor-pointer flex overflow-hidden"
    >
      <div className="w-1 flex-shrink-0" style={{ background: cfg?.color }} />
      <div className="flex-1 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Monogram board={item.board} size={24} />
            <span className="font-medium text-[#1A2B3C] text-sm truncate">{item.title}</span>
          </div>
          <StatusPill status={item.status} board={item.board} />
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          {item.date && (
            <span className={`text-xs ${urgencyClass(item.date)}`}>{urgencyLabel(item.date)}</span>
          )}
          {item.checklist.length > 0 && (
            <span className="text-xs text-[#5A7A94] flex items-center gap-1">
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
  )
}

// ══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════
export default function Dashboard() {
  const router = useRouter()
  const [user,       setUser]       = useState<User | null>(null)
  const [items,      setItems]      = useState<Item[]>([])
  const [loading,    setLoading]    = useState(true)
  const [activeBoard, setActiveBoard] = useState<string>('all')
  const [showAdd,    setShowAdd]    = useState(false)
  const [detail,     setDetail]     = useState<Item | null>(null)
  const [shareBoard, setShareBoard] = useState<string | null>(null)
  const [search,     setSearch]     = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  // ── Auth check ──────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/'); return }
      setUser(data.user)
      loadItems(data.user.id)
    })
  }, [router])

  // ── Load items ──────────────────────────────────────────
  const loadItems = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: true, nullsFirst: false })

    if (error) { console.error(error); setLoading(false); return }

    if (!data || data.length === 0) {
      // New user — seed with sample items
      await seedUser(uid)
    } else {
      setItems(data as Item[])
      setLoading(false)
    }
  }, [])

  // ── Seed new user ───────────────────────────────────────
  const seedUser = async (uid: string) => {
    const seeds = getSeedItems().map(s => ({ ...s, user_id: uid }))
    const { data, error } = await supabase.from('items').insert(seeds).select()
    if (!error && data) setItems(data as Item[])
    setLoading(false)
  }

  // ── Add item ────────────────────────────────────────────
  const addItem = async (partial: Partial<Item>) => {
    if (!user) return
    const { data, error } = await supabase
      .from('items')
      .insert({ ...partial, user_id: user.id })
      .select()
      .single()
    if (!error && data) setItems(prev => [...prev, data as Item].sort((a,b) => (a.date ?? 'z') > (b.date ?? 'z') ? 1 : -1))
    setShowAdd(false)
  }

  // ── Update item ─────────────────────────────────────────
  const updateItem = async (id: string, updates: Partial<Item>) => {
    const { data, error } = await supabase.from('items').update(updates).eq('id', id).select().single()
    if (!error && data) {
      const updated = data as Item
      setItems(prev => prev.map(i => i.id === id ? updated : i))
      setDetail(updated)
    }
  }

  // ── Delete item ─────────────────────────────────────────
  const deleteItem = async (id: string) => {
    await supabase.from('items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    setDetail(null)
  }

  // ── Filtered items ──────────────────────────────────────
  const filtered = items.filter(i => {
    const boardMatch  = activeBoard === 'all' || i.board === activeBoard
    const searchMatch = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.notes?.toLowerCase().includes(search.toLowerCase())
    return boardMatch && searchMatch
  })

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
      <div className="text-[#1B4F8A] font-georgia text-xl animate-pulse">Loading your boards…</div>
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

            {/* Board tabs */}
            <div className="flex items-center gap-1 overflow-x-auto flex-1 scrollbar-hide">
              <button
                onClick={() => setActiveBoard('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeBoard === 'all' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white/90'}`}
              >
                <Layers size={13} /> All Boards
              </button>
              {BOARDS.map(b => (
                <button
                  key={b.id}
                  onClick={() => setActiveBoard(b.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeBoard === b.id ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white/90'}`}
                >
                  <span className="w-4 h-4 rounded flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: b.color, fontSize: 9, fontFamily: 'Georgia, serif' }}>{b.letter}</span>
                  <span className="hidden sm:inline">{b.label}</span>
                  <span className="inline sm:hidden">{b.letter}</span>
                </button>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setSearchOpen(s => !s)} className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <Search size={16} />
              </button>
              <button onClick={signOut} className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
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
                placeholder="Search items, notes…"
                className="w-full bg-white/10 text-white placeholder-white/40 rounded-lg px-4 py-2 text-sm focus:outline-none focus:bg-white/20 transition-colors"
              />
            </div>
          )}
        </div>
      </nav>

      {/* ── STATS STRIP ── */}
      <div className="bg-white border-b border-[#EBF3FB]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex gap-6 overflow-x-auto">
          {[
            { label: 'This week',     value: thisWeek,  color: '#1B4F8A' },
            { label: 'RSVPs needed',  value: rsvpNeed,  color: '#F5A623' },
            { label: 'Open items',    value: openTasks, color: '#2E9E8F' },
            { label: 'Total items',   value: items.length, color: '#5A7A94' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 flex-shrink-0">
              <span className="text-2xl font-bold font-georgia" style={{ color: s.color }}>{s.value}</span>
              <span className="text-xs text-[#5A7A94] leading-tight">{s.label}</span>
            </div>
          ))}

          {/* User greeting */}
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {user?.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="" className="w-7 h-7 rounded-full" />
            )}
            <span className="text-xs text-[#5A7A94] hidden sm:block">
              {user?.user_metadata?.full_name?.split(' ')[0] ?? 'Welcome'}
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* Board header when filtered */}
        {activeBoard !== 'all' && (() => {
          const cfg = BOARD_MAP[activeBoard as keyof typeof BOARD_MAP]
          return (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Monogram board={activeBoard} size={40} />
                <div>
                  <div className="font-georgia font-bold text-xl text-[#1A2B3C]">{cfg?.label}</div>
                  <div className="text-sm text-[#5A7A94]">{cfg?.tagline}</div>
                </div>
              </div>
              <button
                onClick={() => setShareBoard(activeBoard)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4E6F1] text-[#5A7A94] text-xs font-medium hover:bg-[#EBF3FB] transition-colors"
              >
                <Share2 size={13} /> Share board
              </button>
            </div>
          )
        })()}

        {/* Items grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📋</div>
            <div className="font-semibold text-[#1A2B3C] mb-1">No items yet</div>
            <div className="text-sm text-[#5A7A94] mb-4">Add your first item to get started.</div>
            <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-xl bg-[#1B4F8A] text-white text-sm font-medium hover:bg-[#15407A] transition-colors">
              Add Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(item => (
              <ItemCard key={item.id} item={item} onClick={() => setDetail(item)} />
            ))}
          </div>
        )}
      </main>

      {/* ── FAB ── */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#1B4F8A] text-white shadow-lg hover:bg-[#15407A] transition-colors flex items-center justify-center z-20"
      >
        <Plus size={24} />
      </button>

      {/* ── MODALS ── */}
      {showAdd   && <AddModal    defaultBoard={activeBoard === 'all' ? 'event' : activeBoard} onSave={addItem} onClose={() => setShowAdd(false)} />}
      {detail    && <DetailModal item={detail} onUpdate={u => updateItem(detail.id, u)} onDelete={() => deleteItem(detail.id)} onClose={() => setDetail(null)} />}
      {shareBoard && <ShareModal board={shareBoard} onClose={() => setShareBoard(null)} />}
    </div>
  )
}

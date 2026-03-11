'use client'
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { Check, X, AlertCircle, Info } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info'
interface Toast {
  id: string
  message: string
  type: ToastType
}
interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

// ── Context ───────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({ toast: () => {} })
export const useToast = () => useContext(ToastContext)

// ── Single Toast ──────────────────────────────────────────
function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true))
    // Auto-dismiss after 2.8s
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(t.id), 300)
    }, 2800)
    return () => clearTimeout(timerRef.current)
  }, [t.id, onDismiss])

  const icons: Record<ToastType, React.ReactNode> = {
    success: <Check size={14} strokeWidth={2.5} />,
    error:   <AlertCircle size={14} strokeWidth={2.5} />,
    info:    <Info size={14} strokeWidth={2.5} />,
  }
  const colors: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: { bg: '#EAFAF1', border: '#27AE60', icon: '#27AE60' },
    error:   { bg: '#FEF0F0', border: '#E74C3C', icon: '#E74C3C' },
    info:    { bg: '#EBF3FB', border: '#1B4F8A', icon: '#1B4F8A' },
  }
  const c = colors[t.type]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: c.bg,
        border: `1px solid ${c.border}40`,
        borderLeft: `3px solid ${c.border}`,
        borderRadius: 12,
        padding: '10px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        minWidth: 240,
        maxWidth: 340,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
        pointerEvents: 'auto',
      }}
    >
      <span style={{ color: c.icon, flexShrink: 0, display: 'flex' }}>{icons[t.type]}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#1A2B3C', flex: 1, lineHeight: 1.4 }}>{t.message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onDismiss(t.id), 300) }}
        style={{ color: '#5A7A94', background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', flexShrink: 0 }}
      >
        <X size={13} />
      </button>
    </div>
  )
}

// ── Provider ──────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev.slice(-3), { id, message, type }]) // max 4 visible
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container — bottom center on mobile, bottom-right on desktop */}
      <div style={{
        position: 'fixed',
        bottom: 88, // above FAB
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <ToastItem key={t.id} t={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

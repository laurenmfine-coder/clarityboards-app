"use client";
/**
 * Clarityboards — Shared Settings Shell
 * File: components/SettingsShell.tsx
 *
 * Provides the unified nav bar, page wrapper, and typography
 * for all settings pages, matching the dashboard editorial aesthetic.
 */

import { useRouter } from "next/navigation";
import { ReactNode } from "react";

const C = {
  bg:      '#FAFAF8',
  surface: '#FFFFFF',
  warm:    '#F5F2EE',
  border:  '#E8E4DF',
  ink:     '#1A1714',
  inkMid:  '#5C5650',
  sub:     '#9C968F',
  accent:  '#8B6B52',
  serif:   "'Cormorant Garamond', Georgia, serif",
  sans:    "'DM Sans', system-ui, sans-serif",
};

interface SettingsShellProps {
  title: string;
  back?: string;        // href or "back" to use router.back()
  backLabel?: string;   // label for back button, defaults to "Dashboard"
  action?: ReactNode;   // right side action button(s)
  maxWidth?: number;
  children: ReactNode;
}

export default function SettingsShell({
  title,
  back = '/dashboard',
  backLabel = 'Dashboard',
  action,
  maxWidth = 680,
  children,
}: SettingsShellProps) {
  const router = useRouter();

  const handleBack = () => {
    if (back === 'back') router.back();
    else router.push(back);
  };

  return (
    <div style={{ fontFamily: C.sans, minHeight: '100vh', background: C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');
        * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        .ss-card { background: white; border-radius: 8px; border: 0.5px solid ${C.border}; }
        .ss-row:hover { background: #FDFCFA !important; }
        input:focus, textarea:focus, select:focus { border-color: ${C.accent} !important; outline: none; }
      `}</style>

      {/* Nav */}
      <header style={{
        background: C.ink, borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{ maxWidth, margin: '0 auto', padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: C.sans, fontSize: 13, fontWeight: 300, padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 12L6 8l4-4"/>
            </svg>
            {backLabel}
          </button>
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)' }} />
          <span style={{ fontFamily: C.serif, color: 'white', fontSize: 19, fontWeight: 400, letterSpacing: '0.01em', flex: 1 }}>
            {title}
          </span>
          {action && <div style={{ marginLeft: 'auto' }}>{action}</div>}
        </div>
      </header>

      {/* Body */}
      <main style={{ maxWidth, margin: '0 auto', padding: '32px 24px 80px' }}>
        {children}
      </main>
    </div>
  );
}

// ── Shared design primitives exported for use in settings pages ──

export const SC = C; // colors

export function SSection({ children }: { children: ReactNode }) {
  return <div style={{ marginBottom: 28 }}>{children}</div>;
}

export function SLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: C.sub, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 10, fontFamily: C.sans }}>
      {children}
    </div>
  );
}

export function SCard({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="ss-card" style={{ overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

export function SRow({ children, onClick, style }: { children: ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <div className={onClick ? 'ss-row' : undefined} onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: `0.5px solid ${C.border}`, cursor: onClick ? 'pointer' : 'default', background: 'white', transition: 'background 0.12s', ...style }}>
      {children}
    </div>
  );
}

export function SInput({ value, onChange, placeholder, type = 'text', style }: {
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; style?: React.CSSProperties;
}) {
  return (
    <input value={value} onChange={onChange} type={type} placeholder={placeholder}
      style={{ width: '100%', padding: '10px 12px', borderRadius: 4, border: `0.5px solid ${C.border}`, fontSize: 13, fontFamily: C.sans, color: C.ink, background: '#FAFAF8', fontWeight: 300, outline: 'none', transition: 'border-color 0.15s', ...style }} />
  );
}

export function SButton({ children, onClick, variant = 'primary', disabled, style }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean; style?: React.CSSProperties;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: disabled ? '#CCCAC7' : C.ink, color: disabled ? '#8A8884' : 'white', border: 'none' },
    ghost:   { background: 'transparent', color: C.inkMid, border: `0.5px solid ${C.border}` },
    danger:  { background: disabled ? '#CCCAC7' : '#A32D2D', color: 'white', border: 'none' },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: '10px 18px', borderRadius: 4, fontSize: 13, fontFamily: C.sans, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', letterSpacing: '0.02em', transition: 'background 0.15s', ...styles[variant], ...style }}>
      {children}
    </button>
  );
}

export function SBadge({ children, variant = 'neutral' }: {
  children: ReactNode; variant?: 'neutral' | 'success' | 'warning' | 'info' | 'danger';
}) {
  const styles: Record<string, { bg: string; text: string }> = {
    neutral: { bg: '#F5F2EE', text: '#9C968F' },
    success: { bg: '#EDF5F0', text: '#3D6B52' },
    warning: { bg: '#FEF3CD', text: '#8B6914' },
    info:    { bg: '#EAF4F8', text: '#2C6E8A' },
    danger:  { bg: '#FCEBEB', text: '#A32D2D' },
  };
  const s = styles[variant];
  return (
    <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 3, background: s.bg, color: s.text, letterSpacing: '0.04em', textTransform: 'uppercase' as const, fontFamily: C.sans, whiteSpace: 'nowrap' as const }}>
      {children}
    </span>
  );
}

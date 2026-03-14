"use client";

/**
 * Clarityboards — Google Calendar Sync Settings Panel
 * File: app/settings/gcal/page.tsx  (or embed anywhere as <GCalSyncPanel />)
 *
 * Shows:
 *  - Connection status (connected / not connected)
 *  - Pull button: import upcoming Google Calendar events → Clarityboards
 *  - Per-board toggle: enable/disable auto-push for each board
 *  - Last synced timestamp
 *  - Link to Google Calendar to verify events
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGoogleCalendarSync } from "@/lib/useGoogleCalendarSync";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BoardSyncPref {
  id: string;
  label: string;
  color: string;
  emoji: string;
  enabled: boolean;
}

interface PullResult {
  imported: number;
  events?: { title: string; date: string }[];
  message?: string;
}

// ─── Board config (mirrors boards.ts) ────────────────────────────────────────

const BOARD_DEFAULTS: Omit<BoardSyncPref, "enabled">[] = [
  { id: "event",    label: "EventBoard",    color: "#1B4F8A", emoji: "🎉" },
  { id: "study",    label: "StudyBoard",    color: "#2E9E8F", emoji: "📚" },
  { id: "activity", label: "ActivityBoard", color: "#E67E22", emoji: "⚽" },
  { id: "career",   label: "CareerBoard",   color: "#8E44AD", emoji: "💼" },
  { id: "task",     label: "TaskBoard",     color: "#27AE60", emoji: "✅" },
];

// ─── Subcomponents ────────────────────────────────────────────────────────────

function Toggle({ enabled, onChange, color }: { enabled: boolean; onChange: () => void; color: string }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        background: enabled ? color : "#d1d5db",
        position: "relative", transition: "background 0.25s ease", flexShrink: 0,
        padding: 0,
      }}
      aria-checked={enabled}
      role="switch"
    >
      <div style={{
        position: "absolute", top: 3, left: enabled ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "white",
        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
        transition: "left 0.25s ease",
      }} />
    </button>
  );
}

function StatusPill({ connected }: { connected: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: connected ? "#EAFAF1" : "#FEF3E8",
      color: connected ? "#27AE60" : "#E67E22",
      border: `1px solid ${connected ? "#27AE60" : "#E67E22"}30`,
      borderRadius: 4, padding: "4px 12px", fontSize: 12,
      fontFamily: "'DM Mono', monospace", fontWeight: 700,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: connected ? "#27AE60" : "#E67E22", display: "inline-block" }} />
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GCalSyncPanel() {
  const router = useRouter();
  const { pullEvents, syncing, lastSynced, error } = useGoogleCalendarSync();

  const [connected] = useState(true); // In production: derive from session.provider_token existence
  const [boards, setBoards] = useState<BoardSyncPref[]>(
    BOARD_DEFAULTS.map(b => ({ ...b, enabled: b.id === "event" })) // EventBoard on by default
  );
  const [pullResult, setPullResult] = useState<PullResult | null>(null);
  const [pulling, setPulling] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [showImported, setShowImported] = useState(false);

  // Load saved prefs from localStorage (production: use Supabase user_settings table)
  useEffect(() => {
    const saved = localStorage.getItem("cb_gcal_board_prefs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBoards(prev => prev.map(b => ({ ...b, enabled: parsed[b.id] ?? b.enabled })));
      } catch {}
    }
  }, []);

  const saveBoardPrefs = (updated: BoardSyncPref[]) => {
    const prefs = Object.fromEntries(updated.map(b => [b.id, b.enabled]));
    localStorage.setItem("cb_gcal_board_prefs", JSON.stringify(prefs));
  };

  const toggleBoard = (id: string) => {
    const updated = boards.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b);
    setBoards(updated);
    saveBoardPrefs(updated);
  };

  const handlePull = async () => {
    setPulling(true);
    setPullResult(null);
    setShowImported(false);
    const result = await pullEvents();
    setPulling(false);
    if (!result.error) {
      setPullResult(result as PullResult);
      setShowImported(true);
      setTimeout(() => setShowImported(false), 8000);
    }
  };

  const enabledBoards = boards.filter(b => b.enabled);

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: '100vh', background: '#FAFAF8' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');
        * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-slide { animation: fadeSlide 0.3s ease; }
      `}</style>
      <nav style={{ background: '#1A1714', borderBottom: '0.5px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 300, padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 12L6 8l4-4"/></svg>
            Dashboard
          </button>
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)' }}/>
          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'white', fontSize: 19, fontWeight: 400, letterSpacing: '0.01em' }}>
            Google Calendar Sync
          </span>
        </div>
      </nav>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 24px 60px' }}>

      {/* ── Header ── */}
      <div style={{ padding: "28px 0 20px", borderBottom: "1px solid #e8edf5", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #4285F4, #34A853)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 3px 12px rgba(66,133,244,0.35)" }}>
            📅
          </div>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, color: "#1a1a2e", margin: 0 }}>
              Google Calendar Sync
            </h1>
            <p style={{ fontSize: 13, color: "#888", margin: "2px 0 0", fontFamily: "'DM Mono', monospace" }}>
              Two-way · Updates automatically
            </p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <StatusPill connected={connected} />
          </div>
        </div>
      </div>

      {/* ── Not connected banner ── */}
      {!connected && (
        <div className="fade-slide" style={{ background: "#FEF3E8", border: "1px solid #E67E2230", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: "#E67E22", marginBottom: 6, fontSize: 14 }}>
            Connect your Google account to enable sync
          </div>
          <p style={{ fontSize: 13, color: "#666", margin: "0 0 14px", lineHeight: 1.5 }}>
            You'll be asked to grant Clarityboards permission to read and write your Google Calendar events. We only access your calendar — nothing else.
          </p>
          <button style={{ background: "#4285F4", color: "white", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Connect Google Calendar →
          </button>
        </div>
      )}

      {connected && (
        <>
          {/* ── How it works ── */}
          <div style={{ background: "#EBF3FB", borderRadius: 12, padding: "14px 16px", marginBottom: 20, border: "1px solid #1B4F8A15" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#1B4F8A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
              How it works
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "→", text: "Push: When you add or update an item in Clarityboards, it appears in Google Calendar automatically." },
                { icon: "←", text: "Pull: Import your upcoming Google Calendar events into EventBoard with one tap." },
                { icon: "🎨", text: "Color-coded: Each board maps to a matching Google Calendar color." },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 14, color: "#1B4F8A", flexShrink: 0, width: 18, textAlign: "center" }}>{row.icon}</span>
                  <span style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>{row.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Auto-sync toggle ── */}
          <div style={{ background: "white", border: "1px solid #e8edf5", borderRadius: 12, padding: "16px 18px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e", marginBottom: 3 }}>Auto-sync on save</div>
              <div style={{ fontSize: 12, color: "#888" }}>Automatically push items to Google Calendar when you add or edit them.</div>
            </div>
            <Toggle enabled={autoSync} onChange={() => setAutoSync(v => !v)} color="#1B4F8A" />
          </div>

          {/* ── Board toggles ── */}
          <div style={{ background: "white", border: "1px solid #e8edf5", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid #f0f4f8" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>Sync these boards</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Choose which boards push events to Google Calendar.</div>
            </div>
            {boards.map((board, i) => (
              <div key={board.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "13px 18px",
                borderBottom: i < boards.length - 1 ? "1px solid #f5f7fa" : "none",
                transition: "background 0.15s",
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: board.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                  {board.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" }}>{board.label}</div>
                </div>
                {/* Color dot showing Google Calendar color mapping */}
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: board.color, opacity: board.enabled ? 1 : 0.25, transition: "opacity 0.2s" }} title="Google Calendar color" />
                <Toggle enabled={board.enabled} onChange={() => toggleBoard(board.id)} color={board.color} />
              </div>
            ))}
          </div>

          {/* ── Pull section ── */}
          <div style={{ background: "white", border: "1px solid #e8edf5", borderRadius: 12, padding: "16px 18px", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e", marginBottom: 4 }}>Import from Google Calendar</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 14, lineHeight: 1.5 }}>
              Pull your upcoming Google Calendar events (next 90 days) into <strong>EventBoard</strong>. Already-imported events won't be duplicated.
            </div>
            <button
              onClick={handlePull}
              disabled={pulling || syncing}
              style={{
                background: pulling ? "#e8edf5" : "linear-gradient(135deg, #4285F4, #1B4F8A)",
                color: pulling ? "#888" : "white",
                border: "none", borderRadius: 10, padding: "10px 20px",
                fontSize: 13, fontWeight: 700, cursor: pulling ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.2s", boxShadow: pulling ? "none" : "0 3px 12px rgba(66,133,244,0.35)",
              }}
            >
              {pulling ? (
                <>
                  <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #bbb", borderTop: "2px solid #555", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Importing…
                </>
              ) : "← Import Google Calendar events"}
            </button>

            {/* Pull result */}
            {showImported && pullResult && (
              <div className="fade-slide" style={{ marginTop: 14, background: pullResult.imported > 0 ? "#EAFAF1" : "#f8f9fc", border: `1px solid ${pullResult.imported > 0 ? "#27AE60" : "#e0e7ef"}30`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: pullResult.imported > 0 ? "#27AE60" : "#888", marginBottom: pullResult.imported > 0 ? 8 : 0 }}>
                  {pullResult.imported > 0 ? `✓ Imported ${pullResult.imported} event${pullResult.imported > 1 ? "s" : ""}` : (pullResult.message ?? "Nothing new to import.")}
                </div>
                {pullResult.events && pullResult.events.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {pullResult.events.slice(0, 5).map((e, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#555" }}>
                        <span style={{ color: "#27AE60" }}>✓</span>
                        <span>{e.title}</span>
                        <span style={{ color: "#bbb", fontFamily: "'DM Mono', monospace", marginLeft: "auto" }}>{e.date}</span>
                      </div>
                    ))}
                    {pullResult.events.length > 5 && (
                      <div style={{ fontSize: 11, color: "#aaa", fontFamily: "'DM Mono', monospace" }}>
                        + {pullResult.events.length - 5} more in EventBoard
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Status bar ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 4px" }}>
            <div style={{ fontSize: 11, color: "#bbb", fontFamily: "'DM Mono', monospace" }}>
              {lastSynced
                ? `Last synced ${lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : enabledBoards.length > 0
                  ? `${enabledBoards.length} board${enabledBoards.length > 1 ? "s" : ""} syncing`
                  : "No boards selected"}
            </div>
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#4285F4", fontFamily: "'DM Mono', monospace", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
            >
              Open Google Calendar ↗
            </a>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div className="fade-slide" style={{ background: "#FEF0F0", border: "1px solid #E74C3C30", borderRadius: 10, padding: "12px 16px", marginTop: 10 }}>
              <div style={{ fontWeight: 700, color: "#E74C3C", fontSize: 13, marginBottom: 4 }}>Sync error</div>
              <div style={{ fontSize: 12, color: "#888" }}>{error}</div>
              {error.includes("provider_token") && (
                <div style={{ fontSize: 12, color: "#555", marginTop: 8, lineHeight: 1.5 }}>
                  Your Google session may have expired. Try signing out and back in — make sure to grant calendar access when prompted.
                </div>
              )}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
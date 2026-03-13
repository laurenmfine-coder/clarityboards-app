"use client";

/**
 * Clarityboards — Watch Settings Page
 * File: app/settings/watch/page.tsx
 *
 * Price watch, availability watch, and page change alerts
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type WatchType = "price" | "availability" | "change";
type WatchStatus = "active" | "paused" | "alerted";

interface Watch {
  id: string;
  title: string;
  url: string;
  watch_type: WatchType;
  target_value: number | null;
  current_value: number | null;
  current_text: string | null;
  board: string;
  status: WatchStatus;
  last_checked: string | null;
  last_alerted: string | null;
  created_at: string;
}

const WATCH_EXAMPLES: Record<WatchType, string[]> = {
  price: [
    "✈️ Spring break flights on Google Flights or Kayak",
    "📦 Amazon product you're waiting to buy",
    "🏨 Hotel room on Booking.com or Hotels.com",
    "🎟️ Concert tickets on StubHub",
  ],
  availability: [
    "🩺 Doctor or specialist appointment slot",
    "🦷 Dentist opening on Zocdoc",
    "🏛️ DMV appointment availability",
    "🎓 Tutoring session on Care.com",
  ],
  change: [
    "📋 School website for new announcements",
    "📊 Your child's grades page",
    "🏆 Sports league schedule updates",
    "🗞️ Any page you want to monitor for changes",
  ],
};

const TYPE_LABELS: Record<WatchType, string> = {
  price: "💰 Price Drop",
  availability: "📅 Availability",
  change: "🔔 Page Change",
};

const BOARD_OPTIONS = [
  { value: "event", label: "EventBoard" },
  { value: "task", label: "TaskBoard" },
  { value: "activity", label: "ActivityBoard" },
  { value: "study", label: "StudyBoard" },
  { value: "career", label: "CareerBoard" },
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1px solid #E8EDF5", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  outline: "none", marginBottom: 12, background: "white", color: "#1A2B3C", boxSizing: "border-box",
};

function fmtDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function WatchPage() {
  const router = useRouter();
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/watch")
      .then(r => r.json())
      .then(d => { setWatches(d.watches ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const addWatch = async (w: Omit<Watch, "id" | "status" | "last_checked" | "last_alerted" | "created_at" | "current_value" | "current_text">) => {
    const res = await fetch("/api/watch?action=create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(w),
    });
    const data = await res.json();
    if (data.watch) {
      setWatches(prev => [data.watch, ...prev]);
      setShowAdd(false);
    }
  };

  const deleteWatch = async (id: string) => {
    await fetch(`/api/watch?id=${id}`, { method: "DELETE" });
    setWatches(prev => prev.filter(w => w.id !== id));
  };

  const togglePause = async (watch: Watch) => {
    const newStatus = watch.status === "paused" ? "active" : "paused";
    await fetch(`/api/watch?id=${watch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setWatches(prev => prev.map(w => w.id === watch.id ? { ...w, status: newStatus } : w));
  };

  const checkNow = async (watch: Watch) => {
    setChecking(watch.id);
    try {
      const res = await fetch("/api/watch?action=check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: watch.id }),
      });
      const data = await res.json();
      const msg = data.value !== null
        ? `Current: $${data.value}${data.alert ? " 🔔 Alert!" : ""}`
        : data.text
        ? `${data.text}${data.alert ? " 🔔 Alert!" : ""}`
        : "Checked — no value found";
      setCheckResult(prev => ({ ...prev, [watch.id]: msg }));
      // refresh watches
      const fresh = await fetch("/api/watch").then(r => r.json());
      setWatches(fresh.watches ?? []);
    } catch {
      setCheckResult(prev => ({ ...prev, [watch.id]: "Check failed" }));
    } finally {
      setChecking(null);
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#F4F7FA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* Nav */}
      <div style={{ background: "#1A2B3C", padding: "0 16px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", height: 56, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{ color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>← Back</button>
          <span style={{ marginLeft: "auto", fontFamily: "'DM Serif Display', serif", color: "rgba(255,255,255,0.9)", fontSize: 16 }}>Watch & Alert</span>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 16px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #1B4F8A, #2874A6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 4px 16px rgba(27,79,138,0.3)" }}>👁️</div>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#1A2B3C" }}>Watch & Alert</div>
            <div style={{ fontSize: 13, color: "#5A7A94", marginTop: 2 }}>Set it and forget it — we'll notify you when things change</div>
          </div>
        </div>

        {/* Add button */}
        <button onClick={() => setShowAdd(true)}
          style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #1B4F8A, #2874A6)", fontSize: 14, fontWeight: 700, color: "white", cursor: "pointer", marginBottom: 20, boxShadow: "0 3px 14px rgba(27,79,138,0.3)" }}>
          + Add Watch
        </button>

        {/* Watch list */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#9AABBD", padding: 40 }}>Loading…</div>
        ) : watches.length === 0 ? (
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #E8EDF5", padding: "32px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👁️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A2B3C", marginBottom: 6 }}>Nothing being watched yet</div>
            <div style={{ fontSize: 13, color: "#9AABBD", lineHeight: 1.6 }}>Add a watch and we'll notify you when prices drop,<br />appointments open, or pages change.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {watches.map(watch => (
              <WatchCard key={watch.id} watch={watch}
                checking={checking === watch.id}
                checkMsg={checkResult[watch.id]}
                onDelete={() => deleteWatch(watch.id)}
                onTogglePause={() => togglePause(watch)}
                onCheckNow={() => checkNow(watch)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && <AddWatchModal onSave={addWatch} onClose={() => setShowAdd(false)} />}
    </div>
  );
}

// ── Watch Card ────────────────────────────────────────────────────────────────
function WatchCard({ watch, checking, checkMsg, onDelete, onTogglePause, onCheckNow }: {
  watch: Watch; checking: boolean; checkMsg?: string;
  onDelete: () => void; onTogglePause: () => void; onCheckNow: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isAlerted = watch.status === "alerted";
  const isPaused = watch.status === "paused";

  const statusColor = isAlerted ? "#27AE60" : isPaused ? "#9AABBD" : "#1B4F8A";
  const statusLabel = isAlerted ? "✓ Alerted" : isPaused ? "Paused" : "Watching";

  return (
    <div style={{ background: "white", borderRadius: 14, border: `1px solid ${isAlerted ? "#ABEBC6" : "#E8EDF5"}`, overflow: "hidden" }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 20 }}>{watch.watch_type === "price" ? "💰" : watch.watch_type === "availability" ? "📅" : "🔔"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A2B3C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{watch.title}</div>
          <div style={{ fontSize: 11, color: "#9AABBD", marginTop: 2 }}>
            {watch.watch_type === "price" && watch.current_value !== null && `Current: $${watch.current_value} · `}
            {watch.watch_type === "price" && watch.target_value !== null && `Target: $${watch.target_value} · `}
            Last checked: {fmtDate(watch.last_checked)}
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: isAlerted ? "#EAFAF1" : isPaused ? "#F4F7FA" : "#EBF3FB", padding: "3px 8px", borderRadius: 6, flexShrink: 0 }}>{statusLabel}</div>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #F4F7FA" }}>
          <a href={watch.url} target="_blank" rel="noreferrer" style={{ display: "block", fontSize: 12, color: "#2874A6", marginTop: 10, marginBottom: 10, wordBreak: "break-all" }}>🔗 {watch.url}</a>
          {watch.current_text && <div style={{ fontSize: 12, color: "#5A7A94", marginBottom: 10, background: "#F4F7FA", borderRadius: 8, padding: "8px 10px" }}>{watch.current_text}</div>}
          {checkMsg && <div style={{ fontSize: 12, color: "#27AE60", marginBottom: 10, fontWeight: 600 }}>{checkMsg}</div>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={onCheckNow} disabled={checking}
              style={{ fontSize: 12, fontWeight: 600, color: "#1B4F8A", background: "#EBF3FB", border: "none", borderRadius: 8, padding: "7px 12px", cursor: checking ? "not-allowed" : "pointer" }}>
              {checking ? "Checking…" : "↻ Check Now"}
            </button>
            <button onClick={onTogglePause}
              style={{ fontSize: 12, fontWeight: 600, color: "#5A7A94", background: "#F4F7FA", border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer" }}>
              {isPaused ? "▶ Resume" : "⏸ Pause"}
            </button>
            <button onClick={onDelete}
              style={{ fontSize: 12, fontWeight: 600, color: "#E74C3C", background: "#FEF0F0", border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer" }}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add Watch Modal ───────────────────────────────────────────────────────────
function AddWatchModal({ onSave, onClose }: {
  onSave: (w: any) => Promise<void>; onClose: () => void;
}) {
  const [watchType, setWatchType] = useState<WatchType>("price");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [board, setBoard] = useState("event");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) return;
    setSaving(true);
    setSaveStatus("Checking current value…");
    try {
      await onSave({
        title, url, watch_type: watchType,
        target_value: targetValue ? parseFloat(targetValue) : null,
        board,
      });
      setSaveStatus("✓ Watch added!");
    } catch {
      setSaveStatus("Something went wrong — try again");
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "white", width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", fontFamily: "'DM Sans', sans-serif", maxHeight: "92dvh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1A2B3C" }}>Add Watch</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9AABBD" }}>×</button>
        </div>

        {/* Watch type */}
        <div style={{ fontSize: 12, fontWeight: 700, color: "#5A7A94", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Watch Type</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["price", "availability", "change"] as WatchType[]).map(t => (
            <button key={t} onClick={() => setWatchType(t)}
              style={{ flex: 1, padding: "8px 4px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, background: watchType === t ? "#1B4F8A" : "#F4F7FA", color: watchType === t ? "white" : "#5A7A94", textAlign: "center" }}>
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Examples */}
        <div style={{ background: "#F4F7FA", borderRadius: 10, padding: "10px 12px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9AABBD", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Examples</div>
          {WATCH_EXAMPLES[watchType].map((ex, i) => (
            <div key={i} style={{ fontSize: 12, color: "#5A7A94", marginBottom: 3 }}>{ex}</div>
          ))}
        </div>

        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What are you watching? (e.g. Spring Break Flights)" style={inputStyle} />
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste the URL to watch" style={inputStyle} />

        {watchType === "price" && (
          <div style={{ position: "relative", marginBottom: 12 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9AABBD", fontSize: 14 }}>$</span>
            <input type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)}
              placeholder="Alert me when price drops below (optional)"
              style={{ ...inputStyle, paddingLeft: 26, marginBottom: 0 }} />
          </div>
        )}

        <div style={{ fontSize: 12, fontWeight: 700, color: "#5A7A94", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, marginTop: 4 }}>Create alert in</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {BOARD_OPTIONS.map(b => (
            <button key={b.value} onClick={() => setBoard(b.value)}
              style={{ padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: board === b.value ? "#1B4F8A" : "#F4F7FA", color: board === b.value ? "white" : "#5A7A94" }}>
              {b.label}
            </button>
          ))}
        </div>

        {saveStatus && <div style={{ fontSize: 12, color: saveStatus.startsWith("✓") ? "#27AE60" : "#9AABBD", marginBottom: 12, textAlign: "center" }}>{saveStatus}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #E8EDF5", background: "white", color: "#5A7A94", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim() || !url.trim()}
            style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: saving ? "#9AABBD" : "#1B4F8A", color: "white", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 14 }}>
            {saving ? "Adding…" : "Start Watching"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

/**
 * Clarityboards — Board Names Settings
 * File: app/settings/boards/page.tsx
 *
 * Lets users rename any of the 5 boards.
 * Names are stored in localStorage under 'cb_board_names'.
 * Instant live preview — no save button needed.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const BOARDS = [
  { id: "event",    defaultLabel: "EventBoard",    color: "#1B4F8A", emoji: "🎉", letter: "E" },
  { id: "study",    defaultLabel: "StudyBoard",    color: "#2E9E8F", emoji: "📚", letter: "S" },
  { id: "activity", defaultLabel: "ActivityBoard", color: "#E67E22", emoji: "⚽", letter: "A" },
  { id: "career",   defaultLabel: "CareerBoard",   color: "#8E44AD", emoji: "💼", letter: "C" },
  { id: "task",     defaultLabel: "TaskBoard",     color: "#27AE60", emoji: "✅", letter: "T" },
];

const STORAGE_KEY = "cb_board_names";

export default function BoardNamesPage() {
  const router = useRouter();
  const [names, setNames] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setNames(JSON.parse(stored));
    } catch {}
  }, []);

  const update = (id: string, value: string) => {
    const trimmed = value.trim();
    const updated = { ...names };
    if (!trimmed || trimmed === BOARDS.find(b => b.id === id)?.defaultLabel) {
      delete updated[id];
    } else {
      updated[id] = trimmed;
    }
    setNames(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Flash "saved" indicator
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const resetAll = () => {
    setNames({});
    localStorage.removeItem(STORAGE_KEY);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#F4F7FA" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.2s ease; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1A2B3C", padding: "0 16px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", height: 56, display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{ color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: 8, display: "flex", alignItems: "center" }}
          >
            ← Back
          </button>
          <div style={{ flex: 1 }} />
          {saved && (
            <span className="fade-in" style={{ fontSize: 12, color: "#27AE60", fontWeight: 700, background: "#EAFAF1", padding: "4px 10px", borderRadius: 20 }}>
              ✓ Saved
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px 60px" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#1A2B3C", marginBottom: 6 }}>
            Rename Your Boards
          </div>
          <p style={{ fontSize: 14, color: "#5A7A94", lineHeight: 1.5, margin: 0 }}>
            Give each board a name that fits your family. Changes appear everywhere in the app instantly.
          </p>
        </div>

        {/* Board rows */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #E8EDF5", overflow: "hidden", marginBottom: 16 }}>
          {BOARDS.map((board, i) => {
            const currentName = names[board.id] || board.defaultLabel;
            const isCustom = !!names[board.id];

            return (
              <div
                key={board.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 20px",
                  borderBottom: i < BOARDS.length - 1 ? "1px solid #F0F4F8" : "none",
                }}
              >
                {/* Board monogram */}
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: board.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: "Georgia, serif", fontWeight: "bold", fontSize: 16, color: "white",
                }}>
                  {board.letter}
                </div>

                {/* Input */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#9AABBD", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
                    {board.defaultLabel}
                  </div>
                  <input
                    type="text"
                    defaultValue={names[board.id] || ""}
                    placeholder={board.defaultLabel}
                    maxLength={40}
                    onBlur={e => update(board.id, e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
                    style={{
                      width: "100%",
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#1A2B3C",
                      border: "none",
                      borderBottom: `2px solid ${isCustom ? board.color : "#E8EDF5"}`,
                      padding: "2px 0",
                      background: "transparent",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = board.color }}
                  />
                </div>

                {/* Custom badge / reset */}
                {isCustom && (
                  <button
                    onClick={() => {
                      const updated = { ...names };
                      delete updated[board.id];
                      setNames(updated);
                      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                      // Reset input value visually
                      const inputs = document.querySelectorAll(`input`);
                      // Force re-render by updating state
                      setSaved(true);
                      setTimeout(() => setSaved(false), 1800);
                    }}
                    title="Reset to default"
                    style={{
                      fontSize: 12, color: board.color, background: `${board.color}15`,
                      border: "none", borderRadius: 8, padding: "4px 8px",
                      cursor: "pointer", fontWeight: 700, flexShrink: 0,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Reset all */}
        {Object.keys(names).length > 0 && (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={resetAll}
              style={{
                fontSize: 13, color: "#5A7A94", background: "none", border: "1px solid #D4E6F1",
                borderRadius: 10, padding: "8px 20px", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
              }}
            >
              Reset all to defaults
            </button>
          </div>
        )}

        {/* Tip */}
        <div style={{ marginTop: 28, background: "#EBF3FB", borderRadius: 12, padding: "14px 16px", border: "1px solid #1B4F8A15" }}>
          <div style={{ fontSize: 12, color: "#1B4F8A", lineHeight: 1.6 }}>
            <strong>Tip:</strong> Board IDs stay the same internally — renaming won't affect your existing items, shared boards, or calendar integrations. Names are saved to this device.
          </div>
        </div>
      </div>
    </div>
  );
}

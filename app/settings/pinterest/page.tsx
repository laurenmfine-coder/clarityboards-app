"use client";

/**
 * Clarityboards — Pinterest Board Settings (v2)
 * File: app/settings/pinterest/page.tsx
 *
 * - Remembers all previously used boards in localStorage
 * - Shows saved boards as clickable chips — one tap to reload
 * - Nickname each board for easy identification
 * - Fix: follows Pinterest pin pages to source site for real images + titles
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface PinSuggestion {
  pinId: string;
  title: string;
  pinUrl: string;
  recipeUrl: string | null;
  image: string | null;
  source: string | null;
}

interface SavedBoard {
  url: string;
  nickname: string;
  lastUsed: string; // ISO date
  pinCount?: number;
}

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "prep"] as const;
type MealType = typeof MEAL_TYPES[number];
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "🌅 Morning", lunch: "☀️ Midday", dinner: "🌙 Evening",
  snack: "🍎 Snack", prep: "🥣 Prep",
};

const LS_KEY = "cb_pinterest_boards_v2";

function loadSavedBoards(): SavedBoard[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveBoardToHistory(url: string, nickname: string, pinCount?: number) {
  const boards = loadSavedBoards();
  const existing = boards.findIndex(b => b.url === url);
  const entry: SavedBoard = { url, nickname, lastUsed: new Date().toISOString(), pinCount };
  if (existing >= 0) boards[existing] = entry;
  else boards.unshift(entry);
  // Keep max 10
  try { localStorage.setItem(LS_KEY, JSON.stringify(boards.slice(0, 10))); } catch {}
}

function nicknameFromUrl(url: string): string {
  // Extract board name from URL: pinterest.com/user/boardname
  const parts = url.replace(/\/$/, '').split('/').filter(Boolean);
  const boardName = parts[parts.length - 1] ?? '';
  return boardName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'My Board';
}

export default function PinterestSettingsPage() {
  const router = useRouter();
  const [boardUrl, setBoardUrl]   = useState("");
  const [activeUrl, setActiveUrl] = useState("");
  const [pins, setPins]           = useState<PinSuggestion[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [addingPin, setAddingPin] = useState<string | null>(null);
  const [addedPins, setAddedPins] = useState<Set<string>>(new Set());
  const [scheduleModal, setScheduleModal] = useState<PinSuggestion | null>(null);
  const [savedBoards, setSavedBoards]     = useState<SavedBoard[]>([]);
  const [editingNick, setEditingNick]     = useState<string | null>(null); // url being renamed
  const [nickInput, setNickInput]         = useState("");

  useEffect(() => {
    const boards = loadSavedBoards();
    setSavedBoards(boards);
    // Auto-load the most recently used board
    if (boards.length > 0) {
      setBoardUrl(boards[0].url);
      setActiveUrl(boards[0].url);
      loadPins(boards[0].url, false);
    }
  }, []);

  const loadPins = async (url: string, saveToHistory = true) => {
    if (!url.trim()) return;
    setLoading(true); setError(null); setPins([]); setActiveUrl(url.trim());
    try {
      const res = await fetch(`/api/pinterest-rss?boardUrl=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (data.error && data.pins?.length === 0) {
        setError(data.error);
      } else {
        const found = data.pins ?? [];
        setPins(found);
        if (saveToHistory) {
          const nick = nicknameFromUrl(url.trim());
          saveBoardToHistory(url.trim(), nick, found.length);
          setSavedBoards(loadSavedBoards());
        }
      }
    } catch {
      setError("Couldn't reach the board. Check the URL and try again.");
    }
    setLoading(false);
  };

  const connectBoard = () => {
    if (!boardUrl.trim()) return;
    loadPins(boardUrl.trim(), true);
  };

  const removeBoard = (url: string) => {
    const boards = loadSavedBoards().filter(b => b.url !== url);
    try { localStorage.setItem(LS_KEY, JSON.stringify(boards)); } catch {}
    setSavedBoards(boards);
    if (activeUrl === url) { setActiveUrl(""); setPins([]); setBoardUrl(""); }
  };

  const renameBoard = (url: string, nick: string) => {
    const boards = loadSavedBoards().map(b => b.url === url ? { ...b, nickname: nick } : b);
    try { localStorage.setItem(LS_KEY, JSON.stringify(boards)); } catch {}
    setSavedBoards(boards);
    setEditingNick(null);
  };

  const addToMealPlan = async (pin: PinSuggestion, date: string, mealType: MealType) => {
    setAddingPin(pin.pinId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      await supabase.from("items").insert({
        user_id: user.id, board: "meal", title: pin.title, date, meal_type: mealType,
        status: "planned", recipe_url: pin.recipeUrl ?? pin.pinUrl ?? null,
        cover_image: pin.image ?? null, ingredients: [], checklist: [],
      });
      setAddedPins(prev => new Set([...prev, pin.pinId]));
      setScheduleModal(null);
    } catch (e) { console.error(e); }
    setAddingPin(null);
  };

  const activeBoard = savedBoards.find(b => b.url === activeUrl);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#FAF9F7" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
        * { box-sizing: border-box; }
        .pin-card { transition: transform 0.2s, box-shadow 0.2s; }
        .pin-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(44,35,24,0.12) !important; }
        .board-chip:hover { border-color: #2C2318 !important; }
        .board-chip.active { border-color: #2C2318 !important; background: #2C2318 !important; }
        .board-chip.active * { color: white !important; }
      `}</style>

      {/* Nav */}
      <div style={{ background: "#2C2318", padding: "0 20px", position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", height: 56, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/settings/meal")}
            style={{ color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
            ← MealBoard
          </button>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.12)" }} />
          <span style={{ fontSize: 18 }}>📌</span>
          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", color: "white", fontSize: 19, fontWeight: 500 }}>Pinterest Boards</span>
          {activeUrl && (
            <button onClick={() => loadPins(activeUrl, false)}
              style={{ marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 20, padding: "5px 14px", cursor: "pointer", fontFamily: "inherit" }}>
              ↻ Refresh
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 20px 80px" }}>

        {/* Saved boards */}
        {savedBoards.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#C8B8A8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Your Boards
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {savedBoards.map(board => (
                <div key={board.url} className={`board-chip${activeUrl === board.url ? ' active' : ''}`}
                  style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 24, border: "1px solid #EDE9E3", background: activeUrl === board.url ? "#2C2318" : "white", overflow: "hidden", boxShadow: "0 1px 4px rgba(44,35,24,0.06)", transition: "all 0.15s" }}>

                  {/* Main chip click area */}
                  <button onClick={() => { setBoardUrl(board.url); loadPins(board.url, false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    <span style={{ fontSize: 14 }}>📌</span>
                    <div style={{ textAlign: "left" }}>
                      {editingNick === board.url ? (
                        <input autoFocus value={nickInput} onChange={e => setNickInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') renameBoard(board.url, nickInput || nicknameFromUrl(board.url)); if (e.key === 'Escape') setEditingNick(null); }}
                          onBlur={() => renameBoard(board.url, nickInput || nicknameFromUrl(board.url))}
                          onClick={e => e.stopPropagation()}
                          style={{ fontSize: 13, fontWeight: 600, color: "#2C2318", background: "transparent", border: "none", outline: "1px solid #C17A5A", borderRadius: 4, padding: "1px 4px", fontFamily: "inherit", width: 120 }}
                        />
                      ) : (
                        <div style={{ fontSize: 13, fontWeight: 600, color: activeUrl === board.url ? "white" : "#2C2318" }}>{board.nickname}</div>
                      )}
                      {board.pinCount !== undefined && (
                        <div style={{ fontSize: 10, color: activeUrl === board.url ? "rgba(255,255,255,0.6)" : "#9C8B7A", marginTop: 1 }}>
                          {board.pinCount} pins · {new Date(board.lastUsed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Actions */}
                  <div style={{ display: "flex", borderLeft: `1px solid ${activeUrl === board.url ? 'rgba(255,255,255,0.15)' : '#EDE9E3'}` }}>
                    <button onClick={e => { e.stopPropagation(); setEditingNick(board.url); setNickInput(board.nickname); }}
                      title="Rename"
                      style={{ padding: "8px 10px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: activeUrl === board.url ? "rgba(255,255,255,0.5)" : "#C8B8A8" }}>
                      ✏️
                    </button>
                    <button onClick={e => { e.stopPropagation(); removeBoard(board.url); }}
                      title="Remove"
                      style={{ padding: "8px 10px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: activeUrl === board.url ? "rgba(255,255,255,0.5)" : "#C8B8A8" }}>
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add new board */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #EDE9E3", padding: "18px 22px", marginBottom: 24, boxShadow: "0 1px 6px rgba(44,35,24,0.04)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#C8B8A8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            {savedBoards.length > 0 ? "Add Another Board" : "Connect a Pinterest Board"}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input value={boardUrl} onChange={e => setBoardUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && connectBoard()}
              placeholder="https://pinterest.com/yourname/recipes-to-cook"
              style={{ flex: 1, padding: "10px 13px", borderRadius: 10, border: "1px solid #EDE9E3", fontSize: 13, fontFamily: "inherit", color: "#2C2318", outline: "none", background: "#FFFEF9" }} />
            <button onClick={connectBoard} disabled={!boardUrl.trim() || loading}
              style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: boardUrl.trim() ? "#2C2318" : "#EDE9E3", color: boardUrl.trim() ? "white" : "#C8B8A8", fontWeight: 700, fontSize: 13, cursor: boardUrl.trim() ? "pointer" : "not-allowed", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {loading ? "Loading…" : "Connect"}
            </button>
          </div>
          <p style={{ marginTop: 8, fontSize: 11, color: "#B8A99A", fontStyle: "italic" }}>
            No Pinterest login needed — board must be Public · ✓ Images from source site · ✓ Any public board
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 20, color: "#9C8B7A", fontStyle: "italic", marginBottom: 6 }}>
              {activeBoard ? `Loading ${activeBoard.nickname}…` : "Fetching pins…"}
            </div>
            <div style={{ fontSize: 12, color: "#C8B8A8" }}>Pulling recipe images from each source site</div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ background: "#FDF6F3", border: "1px solid #E8D5C4", borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#8B5E3C" }}>
            ⚠️ {error}
            <div style={{ marginTop: 6, fontSize: 11, color: "#B8A99A" }}>Make sure the board is Public in Pinterest settings.</div>
          </div>
        )}

        {/* Active board header */}
        {pins.length > 0 && !loading && activeBoard && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, color: "#2C2318", fontWeight: 500 }}>
                {activeBoard.nickname}
              </div>
              <div style={{ fontSize: 12, color: "#9C8B7A", marginTop: 2, fontStyle: "italic" }}>{pins.length} recipes found</div>
            </div>
            <button onClick={() => loadPins(activeUrl, false)}
              style={{ fontSize: 12, color: "#9C8B7A", background: "none", border: "1px solid #EDE9E3", borderRadius: 20, padding: "5px 14px", cursor: "pointer", fontFamily: "inherit" }}>
              ↻ Refresh
            </button>
          </div>
        )}

        {/* Pin grid */}
        {pins.length > 0 && !loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
            {pins.map(pin => (
              <div key={pin.pinId} className="pin-card"
                style={{ background: "white", borderRadius: 14, border: "1px solid #EDE9E3", overflow: "hidden", boxShadow: "0 2px 8px rgba(44,35,24,0.06)" }}>
                {pin.image ? (
                  <div style={{ height: 140, overflow: "hidden", position: "relative" }}>
                    <img src={pin.image} alt={pin.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }} />
                    {pin.source && (
                      <div style={{ position: "absolute", bottom: 7, right: 7, background: "rgba(255,255,255,0.9)", borderRadius: 20, padding: "2px 8px", fontSize: 9, fontWeight: 700, color: "#9C8B7A" }}>
                        {pin.source}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ height: 4, background: "#C17A5A" }} />
                )}
                <div style={{ padding: "12px 13px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#2C2318", lineHeight: 1.4, marginBottom: 10 }}>{pin.title}</div>
                  {addedPins.has(pin.pinId) ? (
                    <div style={{ fontSize: 11, color: "#5C8B6A", fontWeight: 700 }}>✓ Added to plan</div>
                  ) : (
                    <button onClick={() => setScheduleModal(pin)}
                      style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", background: "#2C2318", color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                      + Add to Plan
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && pins.length === 0 && activeUrl && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 24, color: "#9C8B7A", fontStyle: "italic", marginBottom: 8 }}>No pins found</div>
            <div style={{ fontSize: 13, color: "#C8B8A8" }}>The board may be empty or private.</div>
          </div>
        )}

        {/* Intro when no boards saved yet */}
        {!loading && savedBoards.length === 0 && !activeUrl && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📌</div>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 26, color: "#2C2318", fontWeight: 500, marginBottom: 8 }}>Import from Pinterest</div>
            <div style={{ fontSize: 13, color: "#9C8B7A", fontStyle: "italic", lineHeight: 1.7, maxWidth: 420, margin: "0 auto" }}>
              Paste any public Pinterest board URL above. Clarityboards fetches the recipe photos from the source sites — Everyday Parisian, NYT Cooking, Bon Appétit — and turns them into one-tap meal plan additions.
            </div>
          </div>
        )}
      </div>

      {scheduleModal && (
        <ScheduleModal pin={scheduleModal} adding={addingPin === scheduleModal.pinId}
          onAdd={(date, mealType) => addToMealPlan(scheduleModal, date, mealType)}
          onClose={() => setScheduleModal(null)} />
      )}
    </div>
  );
}

function ScheduleModal({ pin, adding, onAdd, onClose }: {
  pin: PinSuggestion; adding: boolean;
  onAdd: (date: string, mealType: MealType) => void; onClose: () => void;
}) {
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10));
  const [mealType, setMealType] = useState<MealType>("dinner");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,35,24,0.55)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#FFFEF9", width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", fontFamily: "'DM Sans',sans-serif" }}>
        {pin.image && (
          <div style={{ height: 160, position: "relative", borderRadius: "20px 20px 0 0", overflow: "hidden" }}>
            <img src={pin.image} alt={pin.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(44,35,24,0.6))" }} />
            <div style={{ position: "absolute", bottom: 14, left: 20, right: 50 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 20, color: "white", fontWeight: 600, lineHeight: 1.25 }}>{pin.title}</div>
              {pin.source && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>From {pin.source}</div>}
            </div>
            <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "none", borderRadius: "50%", width: 30, height: 30, fontSize: 16, cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        )}
        <div style={{ padding: pin.image ? "18px 22px 36px" : "28px 22px 36px" }}>
          {!pin.image && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 20, color: "#2C2318" }}>{pin.title}</div>
              <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#C8B8A8" }}>×</button>
            </div>
          )}
          {pin.image && <div style={{ width: 36, height: 4, borderRadius: 2, background: "#EDE9E3", margin: "0 auto 18px" }} />}
          <div style={{ fontSize: 10, fontWeight: 700, color: "#C8B8A8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Meal Type</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
            {(MEAL_TYPES as unknown as MealType[]).map(t => (
              <button key={t} onClick={() => setMealType(t)}
                style={{ padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit", background: mealType === t ? "#2C2318" : "#F2EDE6", color: mealType === t ? "white" : "#9C8B7A" }}>
                {MEAL_LABELS[t]}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#C8B8A8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Date</div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #EDE9E3", fontSize: 14, fontFamily: "inherit", color: "#2C2318", outline: "none", background: "white", marginBottom: 18 }} />
          <button onClick={() => onAdd(date, mealType)} disabled={adding}
            style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: adding ? "#EDE9E3" : "#2C2318", color: adding ? "#C8B8A8" : "white", fontWeight: 700, fontSize: 14, cursor: adding ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {adding ? "Adding…" : "Add to Meal Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

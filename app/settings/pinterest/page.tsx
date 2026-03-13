"use client";

/**
 * Clarityboards — Pinterest Board Settings
 * File: app/settings/pinterest/page.tsx
 *
 * Users paste a public Pinterest board URL once.
 * Clarityboards polls it via RSS and surfaces pins as meal suggestions
 * with full recipe photos fetched from the source site.
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
  description: string | null;
  source: string | null;
}

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "prep"] as const;
type MealType = typeof MEAL_TYPES[number];
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "🌅 Morning", lunch: "☀️ Midday", dinner: "🌙 Evening",
  snack: "🍎 Snack", prep: "🥣 Prep",
};

function fmtDay(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PinterestSettingsPage() {
  const router = useRouter();
  const [boardUrl, setBoardUrl]     = useState("");
  const [savedUrl, setSavedUrl]     = useState("");
  const [pins, setPins]             = useState<PinSuggestion[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [addingPin, setAddingPin]   = useState<string | null>(null); // pinId being added
  const [addedPins, setAddedPins]   = useState<Set<string>>(new Set());
  const [scheduleModal, setScheduleModal] = useState<PinSuggestion | null>(null);

  // Load saved board URL
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cb_pinterest_board");
      if (saved) { setSavedUrl(saved); setBoardUrl(saved); }
    } catch {}
  }, []);

  const loadPins = async (url: string) => {
    if (!url.trim()) return;
    setLoading(true); setError(null); setPins([]);
    try {
      const res = await fetch(`/api/pinterest-rss?boardUrl=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setPins(data.pins ?? []); }
    } catch {
      setError("Couldn't reach the board. Check the URL and try again.");
    }
    setLoading(false);
  };

  const saveBoard = async () => {
    if (!boardUrl.trim()) return;
    localStorage.setItem("cb_pinterest_board", boardUrl.trim());
    setSavedUrl(boardUrl.trim());
    await loadPins(boardUrl.trim());
  };

  const refresh = () => loadPins(savedUrl);

  const addToMealPlan = async (pin: PinSuggestion, date: string, mealType: MealType) => {
    setAddingPin(pin.pinId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      await supabase.from("items").insert({
        user_id: user.id,
        board: "meal",
        title: pin.title,
        date,
        meal_type: mealType,
        status: "planned",
        recipe_url: pin.recipeUrl ?? pin.pinUrl ?? null,
        cover_image: pin.image ?? null,
        ingredients: [],
        checklist: [],
      });

      setAddedPins(prev => new Set([...prev, pin.pinId]));
      setScheduleModal(null);
    } catch (e) {
      console.error(e);
    }
    setAddingPin(null);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#FAF9F7" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
        * { box-sizing: border-box; }
        .pin-card { transition: transform 0.2s, box-shadow 0.2s; }
        .pin-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(44,35,24,0.12) !important; }
        .add-btn { transition: all 0.15s; }
        .add-btn:hover { opacity: 0.85; }
      `}</style>

      {/* Nav */}
      <div style={{ background: "#2C2318", padding: "0 20px", position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", height: 56, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/settings/meal")}
            style={{ color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
            ← MealBoard
          </button>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.12)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>📌</span>
            <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", color: "white", fontSize: 19, fontWeight: 500 }}>Pinterest Boards</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 80px" }}>

        {/* Explainer */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #EDE9E3", padding: "22px 24px", marginBottom: 24, boxShadow: "0 1px 6px rgba(44,35,24,0.06)" }}>
          <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 26, color: "#2C2318", fontWeight: 500, marginBottom: 6 }}>
            Import from Pinterest
          </div>
          <p style={{ fontSize: 13, color: "#9C8B7A", lineHeight: 1.7, marginBottom: 16 }}>
            Paste any <strong style={{ color: "#2C2318" }}>public Pinterest board URL</strong> — your saved recipes board, a "Meals to Cook" board, anything. Clarityboards reads the board's public RSS feed (no login required), fetches the cover photo from each recipe's source site, and turns them into one-tap meal plan additions.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["✓ No Pinterest login needed","✓ Images from source site","✓ Ingredients auto-imported","✓ Any public board"].map(t => (
              <span key={t} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#F2EDE6", color: "#8B6B52", fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Board URL input */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #EDE9E3", padding: "20px 24px", marginBottom: 24, boxShadow: "0 1px 6px rgba(44,35,24,0.06)" }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#C8B8A8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, display: "block" }}>
            Pinterest Board URL
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={boardUrl}
              onChange={e => setBoardUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveBoard()}
              placeholder="https://pinterest.com/yourname/recipes-to-cook"
              style={{ flex: 1, padding: "11px 14px", borderRadius: 10, border: "1px solid #EDE9E3", fontSize: 13, fontFamily: "inherit", color: "#2C2318", outline: "none", background: "#FFFEF9" }}
            />
            <button onClick={saveBoard} disabled={!boardUrl.trim() || loading}
              style={{ padding: "11px 20px", borderRadius: 10, border: "none", background: boardUrl.trim() ? "#2C2318" : "#EDE9E3", color: boardUrl.trim() ? "white" : "#C8B8A8", fontWeight: 700, fontSize: 13, cursor: boardUrl.trim() ? "pointer" : "not-allowed", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {loading ? "Loading…" : savedUrl ? "Refresh" : "Connect"}
            </button>
          </div>
          {savedUrl && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#5C8B6A", display: "flex", alignItems: "center", gap: 6 }}>
              <span>✓ Connected:</span>
              <span style={{ color: "#9C8B7A", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{savedUrl}</span>
            </div>
          )}
          <p style={{ marginTop: 10, fontSize: 11, color: "#B8A99A", fontStyle: "italic" }}>
            The board must be public. Find your board URL on Pinterest → open the board → copy the URL.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 20, color: "#9C8B7A", fontStyle: "italic", marginBottom: 8 }}>
              Fetching your pins…
            </div>
            <div style={{ fontSize: 12, color: "#C8B8A8" }}>Pulling recipe images from each source site</div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ background: "#FDF6F3", border: "1px solid #E8D5C4", borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#8B5E3C" }}>
            ⚠️ {error}
            <div style={{ marginTop: 6, fontSize: 11, color: "#B8A99A" }}>
              Make sure the board is set to Public in Pinterest privacy settings.
            </div>
          </div>
        )}

        {/* Pin grid */}
        {pins.length > 0 && !loading && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, color: "#2C2318", fontWeight: 500 }}>
                {pins.length} Recipes Found
              </div>
              <button onClick={refresh}
                style={{ fontSize: 12, color: "#9C8B7A", background: "none", border: "1px solid #EDE9E3", borderRadius: 20, padding: "5px 14px", cursor: "pointer", fontFamily: "inherit" }}>
                ↻ Refresh
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              {pins.map(pin => (
                <div key={pin.pinId} className="pin-card"
                  style={{ background: "white", borderRadius: 14, border: "1px solid #EDE9E3", overflow: "hidden", boxShadow: "0 2px 8px rgba(44,35,24,0.06)" }}>

                  {/* Photo */}
                  {pin.image ? (
                    <div style={{ height: 140, overflow: "hidden", position: "relative" }}>
                      <img src={pin.image} alt={pin.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                      />
                      {pin.source && (
                        <div style={{ position: "absolute", bottom: 7, right: 7, background: "rgba(255,255,255,0.9)", borderRadius: 20, padding: "2px 8px", fontSize: 9, fontWeight: 700, color: "#9C8B7A" }}>
                          {pin.source}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ height: 4, background: "#C17A5A" }} />
                  )}

                  {/* Info */}
                  <div style={{ padding: "12px 13px 14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#2C2318", lineHeight: 1.4, marginBottom: 10 }}>
                      {pin.title}
                    </div>

                    {/* Add button or Added badge */}
                    {addedPins.has(pin.pinId) ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#5C8B6A", fontWeight: 700 }}>
                        <span>✓</span> Added to plan
                      </div>
                    ) : (
                      <button className="add-btn" onClick={() => setScheduleModal(pin)}
                        style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", background: "#2C2318", color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                        + Add to Plan
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state when connected but no pins */}
        {!loading && !error && pins.length === 0 && savedUrl && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 24, color: "#9C8B7A", fontStyle: "italic", marginBottom: 8 }}>No pins found</div>
            <div style={{ fontSize: 13, color: "#C8B8A8" }}>The board may be empty or private.</div>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {scheduleModal && (
        <ScheduleModal
          pin={scheduleModal}
          adding={addingPin === scheduleModal.pinId}
          onAdd={(date, mealType) => addToMealPlan(scheduleModal, date, mealType)}
          onClose={() => setScheduleModal(null)}
        />
      )}
    </div>
  );
}

// ─── Schedule Modal ───────────────────────────────────────
function ScheduleModal({ pin, adding, onAdd, onClose }: {
  pin: PinSuggestion;
  adding: boolean;
  onAdd: (date: string, mealType: MealType) => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate]         = useState(today);
  const [mealType, setMealType] = useState<MealType>("dinner");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,35,24,0.55)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#FFFEF9", width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", fontFamily: "'DM Sans', sans-serif" }}>
        {/* Hero image */}
        {pin.image && (
          <div style={{ height: 160, position: "relative", borderRadius: "20px 20px 0 0", overflow: "hidden" }}>
            <img src={pin.image} alt={pin.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(44,35,24,0.6))" }} />
            <div style={{ position: "absolute", bottom: 14, left: 20, right: 20 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 20, color: "white", fontWeight: 600, lineHeight: 1.25 }}>{pin.title}</div>
              {pin.source && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>From {pin.source}</div>}
            </div>
            <button onClick={onClose}
              style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "none", borderRadius: "50%", width: 30, height: 30, fontSize: 16, cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ×
            </button>
          </div>
        )}

        <div style={{ padding: pin.image ? "20px 22px 36px" : "28px 22px 36px" }}>
          {!pin.image && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 20, color: "#2C2318", fontWeight: 500 }}>{pin.title}</div>
              <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#C8B8A8" }}>×</button>
            </div>
          )}

          {/* Handle */}
          {pin.image && <div style={{ width: 36, height: 4, borderRadius: 2, background: "#EDE9E3", margin: "0 auto 20px" }} />}

          <label style={{ fontSize: 10, fontWeight: 700, color: "#C8B8A8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, display: "block" }}>Meal Type</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
            {(MEAL_TYPES as unknown as MealType[]).map(t => (
              <button key={t} onClick={() => setMealType(t)}
                style={{ padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit", background: mealType === t ? "#2C2318" : "#F2EDE6", color: mealType === t ? "white" : "#9C8B7A" }}>
                {MEAL_LABELS[t]}
              </button>
            ))}
          </div>

          <label style={{ fontSize: 10, fontWeight: 700, color: "#C8B8A8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, display: "block" }}>Date</label>
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

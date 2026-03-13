"use client";

/**
 * Clarityboards — MealBoard (Flodesk/Everyday Parisian redesign)
 * File: app/settings/meal/page.tsx
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "prep"] as const;
type MealType = typeof MEAL_TYPES[number];
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Morning", lunch: "Midday", dinner: "Evening",
  snack: "Snack", prep: "Prep",
};
const MEAL_ICONS: Record<MealType, string> = {
  breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎", prep: "🥣",
};
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface MealItem {
  id: string; title: string; date: string | null; status: string;
  meal_type: MealType | null; recipe_url: string | null;
  ingredients: string[]; notes: string | null; servings: number | null;
  cover_image?: string | null;
}
interface RecipeResult {
  id: number; title: string; image: string; sourceUrl: string;
  usedIngredientCount: number; missedIngredientCount: number;
  usedIngredients: string[]; missedIngredients: string[];
}
interface ImportedRecipe {
  title: string; servings?: number; readyInMinutes?: number;
  ingredients: string[]; instructions?: string[];
  summary?: string; image?: string; sourceUrl?: string;
}

function getWeekDates(offset = 0): string[] {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}
function fmtDay(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtShort(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Fetch OG image from a URL
async function fetchCoverImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/og-image?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    return data.image ?? null;
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function MealPlannerPage() {
  const router = useRouter();
  const [items, setItems] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekDates, setWeekDates] = useState<string[]>([]);
  const [mode, setMode] = useState<"planner" | "search" | "grocery">("planner");
  const [addModal, setAddModal] = useState<{ date: string; meal_type: MealType } | null>(null);
  const [detailItem, setDetailItem] = useState<MealItem | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => { setWeekDates(getWeekDates(weekOffset)); }, [weekOffset]);
  useEffect(() => { if (weekDates.length) loadMeals(); }, [weekDates]);

  const loadMeals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data } = await supabase.from("items")
      .select("id,title,date,status,meal_type,recipe_url,ingredients,notes,servings,cover_image")
      .eq("user_id", user.id).eq("board", "meal")
      .gte("date", weekDates[0]).lte("date", weekDates[6])
      .order("date", { ascending: true });
    if (data) setItems(data as MealItem[]);
    setLoading(false);
  };

  const addMeal = async (title: string, mealType: MealType, date: string, recipeUrl: string, servings: string, ingredients: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch cover image from URL in background
    let cover_image: string | null = null;
    if (recipeUrl.trim()) {
      cover_image = await fetchCoverImage(recipeUrl.trim());
    }

    const { data } = await supabase.from("items").insert({
      user_id: user.id, board: "meal", title: title.trim(), date, meal_type: mealType,
      status: "planned", recipe_url: recipeUrl.trim() || null,
      servings: servings ? parseInt(servings) : null,
      ingredients: ingredients.filter(Boolean), checklist: [],
      cover_image,
    }).select().single();
    if (data) setItems(prev => [...prev, data as MealItem].sort((a, b) => (a.date ?? "") > (b.date ?? "") ? 1 : -1));
    setAddModal(null);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("items").update({ status }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const updateIngredients = async (id: string, ingredients: string[]) => {
    await supabase.from("items").update({ ingredients }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, ingredients } : i));
  };

  const deleteMeal = async (id: string) => {
    await supabase.from("items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    setDetailItem(null);
  };

  const groceryList = [...new Set(items.flatMap(i => (i.ingredients ?? []).filter((x): x is string => Boolean(x))))].sort();
  const slotMeals = (date: string, mealType: MealType) => items.filter(i => i.date === date && i.meal_type === mealType);
  const weekLabel = weekDates.length ? `${fmtShort(weekDates[0])} – ${fmtShort(weekDates[6])}` : "";

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#FAF9F7" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
        * { box-sizing: border-box; }
        .meal-card { transition: box-shadow 0.2s, transform 0.2s; }
        .meal-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
        .slot-add { transition: all 0.15s; }
        .slot-add:hover { background: #F5EDE8 !important; border-color: #C17A5A !important; }
        .mode-btn { transition: all 0.2s; }
        .recipe-card { transition: all 0.2s; }
        .recipe-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important; }
      `}</style>

      {/* ── NAV — cream with serif ── */}
      <div style={{ background: "#FFFEF9", borderBottom: "1px solid #EDE9E3", padding: "0 20px", position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", height: 60, display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => router.push("/dashboard")}
            style={{ color: "#9C8B7A", background: "none", border: "none", cursor: "pointer", fontSize: 13, letterSpacing: "0.02em" }}>
            ← Dashboard
          </button>
          <div style={{ width: 1, height: 20, background: "#EDE9E3" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#C0392B", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Cormorant Garamond, Georgia, serif", color: "white", fontWeight: 600, fontSize: 15 }}>M</div>
            <span style={{ fontFamily: "Cormorant Garamond, Georgia, serif", color: "#2C2318", fontSize: 22, fontWeight: 500, letterSpacing: "0.02em" }}>MealBoard</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => router.push("/settings/pinterest")}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, border: "1px solid #EDE9E3", background: "white", color: "#9C8B7A", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.02em" }}>
              📌 Pinterest
            </button>
          <div style={{ display: "flex", gap: 2, background: "#F2EDE6", borderRadius: 10, padding: 3 }}>
            {[["planner","Plan"],["search","Recipes"],["grocery","Grocery"]] .map(([m, label]) => (
              <button key={m} className="mode-btn" onClick={() => setMode(m as any)}
                style={{ padding: "6px 14px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em",
                  background: mode === m ? "#FFFEF9" : "transparent",
                  color: mode === m ? "#2C2318" : "#9C8B7A",
                  boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                }}>
                {label}
              </button>
            ))}
          </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px 100px" }}>

        {/* ── RECIPE SEARCH ── */}
        {mode === "search" && (
          <RecipeSearchPanel onAddToPlanner={(recipe, date, mealType) => {
            addMeal(recipe.title, mealType, date, recipe.sourceUrl ?? "", String(recipe.servings ?? ""), recipe.ingredients ?? []);
            setMode("planner");
          }} weekDates={weekDates} />
        )}

        {/* ── GROCERY ── */}
        {mode === "grocery" && (
          <GroceryPanel groceryList={groceryList} weekLabel={weekLabel} items={items} />
        )}

        {/* ── PLANNER ── */}
        {mode === "planner" && (<>

          {/* Week nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <button onClick={() => setWeekOffset(o => o - 1)} style={weekNavBtn}>‹</button>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 20, color: "#2C2318", fontWeight: 500 }}>{weekLabel}</div>
              {weekOffset !== 0 && (
                <button onClick={() => setWeekOffset(0)}
                  style={{ marginTop: 4, fontSize: 11, color: "#C17A5A", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>
                  Back to this week
                </button>
              )}
            </div>
            <button onClick={() => setWeekOffset(o => o + 1)} style={weekNavBtn}>›</button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", color: "#B8A99A", paddingTop: 60, fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 18, fontStyle: "italic" }}>
              Loading your week…
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {weekDates.map((date, di) => {
                const isToday = date === today;
                const dayMeals = items.filter(i => i.date === date);
                return (
                  <div key={date} style={{
                    background: "white",
                    borderRadius: 16,
                    border: isToday ? "1.5px solid #C17A5A" : "1px solid #EDE9E3",
                    overflow: "hidden",
                    boxShadow: isToday ? "0 4px 20px rgba(193,122,90,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                    {/* Day header */}
                    <div style={{ padding: "12px 20px", borderBottom: "1px solid #F5F0EA", display: "flex", alignItems: "center", gap: 12, background: isToday ? "#FDF7F3" : "white" }}>
                      <span style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 18, fontWeight: 600, color: isToday ? "#C17A5A" : "#2C2318", minWidth: 36 }}>{DAY_LABELS[di]}</span>
                      <span style={{ fontSize: 12, color: "#B8A99A", letterSpacing: "0.03em" }}>{fmtDay(date)}</span>
                      {isToday && <span style={{ fontSize: 10, fontWeight: 700, color: "white", background: "#C17A5A", borderRadius: 20, padding: "2px 9px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Today</span>}
                      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                        {(["breakfast", "lunch", "dinner"] as MealType[]).map(mt => {
                          const hasMeal = items.some(i => i.date === date && i.meal_type === mt);
                          return (
                            <div key={mt} style={{ width: 6, height: 6, borderRadius: "50%", background: hasMeal ? "#C0392B" : "#EDE9E3" }} />
                          );
                        })}
                      </div>
                    </div>

                    {/* Meal slots */}
                    <div style={{ padding: "12px 20px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      {(["breakfast", "lunch", "dinner"] as MealType[]).map(mealType => {
                        const meals = slotMeals(date, mealType);
                        return (
                          <div key={mealType}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "#B8A99A", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                              {MEAL_ICONS[mealType]} {MEAL_LABELS[mealType]}
                            </div>
                            {meals.map(meal => (
                              <MealCard key={meal.id} meal={meal} onClick={() => setDetailItem(meal)} />
                            ))}
                            <button className="slot-add" onClick={() => setAddModal({ date, meal_type: mealType })}
                              style={{ width: "100%", padding: "7px", borderRadius: 8, border: "1.5px dashed #E2DAD3", background: "transparent", color: "#C8B8A8", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>
                              +
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>)}
      </div>

      {/* Modals */}
      {addModal && (
        <AddMealModal date={addModal.date} mealType={addModal.meal_type}
          onSave={addMeal} onClose={() => setAddModal(null)} />
      )}
      {detailItem && (
        <MealDetailModal item={detailItem}
          onStatusChange={s => updateStatus(detailItem.id, s)}
          onDelete={() => deleteMeal(detailItem.id)}
          onClose={() => setDetailItem(null)}
          onIngredientsUpdate={updateIngredients}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MEAL CARD — hero image pulled from recipe URL
// ─────────────────────────────────────────────────────────────────────────────
function MealCard({ meal, onClick }: { meal: MealItem; onClick: () => void }) {
  const STATUS_COLORS: Record<string, string> = {
    planned: "#E8D5C4", prepped: "#C4D9E8", cooked: "#C4E8D0", done: "#C8C8C8",
  };
  const STATUS_TEXT: Record<string, string> = {
    planned: "#8B5E3C", prepped: "#3C5E8B", cooked: "#3C8B5C", done: "#6B6B6B",
  };

  return (
    <div className="meal-card" onClick={onClick} style={{
      borderRadius: 10, overflow: "hidden", border: "1px solid #EDE9E3",
      background: "white", marginBottom: 8, cursor: "pointer",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      {/* Hero image from OG tag */}
      {meal.cover_image && (
        <div style={{ height: 72, overflow: "hidden", position: "relative" }}>
          <img src={meal.cover_image} alt={meal.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.35))" }} />
        </div>
      )}
      {/* No image — colored band */}
      {!meal.cover_image && (
        <div style={{ height: 4, background: "#C0392B", opacity: 0.6 }} />
      )}
      <div style={{ padding: "7px 9px 8px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#2C2318", lineHeight: 1.35, marginBottom: 5 }}>{meal.title}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {meal.servings && <span style={{ fontSize: 9, color: "#B8A99A" }}>👤 {meal.servings}</span>}
          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: STATUS_COLORS[meal.status] ?? "#EDE9E3", color: STATUS_TEXT[meal.status] ?? "#6B6B6B", marginLeft: "auto" }}>
            {meal.status.charAt(0).toUpperCase() + meal.status.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD MEAL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function AddMealModal({ date, mealType, onSave, onClose }: {
  date: string; mealType: MealType;
  onSave: (title: string, mealType: MealType, date: string, recipeUrl: string, servings: string, ingredients: string[]) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [recipeUrl, setRecipeUrl] = useState("");
  const [servings, setServings] = useState("");
  const [type, setType] = useState<MealType>(mealType);
  const [parsing, setParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) return;
    const url = recipeUrl.trim();
    if (!url) { onSave(title, type, date, "", servings, []); return; }
    setParsing(true);
    setParseStatus("Importing recipe…");
    try {
      const res = await fetch("/api/recipes?action=import-url", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      const ingredients: string[] = data.recipe?.ingredients ?? [];
      const parsedTitle = title.trim() || data.recipe?.title || title;
      const parsedServings = servings || String(data.recipe?.servings ?? "");
      setParseStatus(ingredients.length > 0 ? `✓ ${ingredients.length} ingredients found` : "Saved — no ingredients detected");
      setTimeout(() => onSave(parsedTitle, type, date, url, parsedServings, ingredients), 500);
    } catch {
      setParseStatus("Saved without ingredients");
      setTimeout(() => onSave(title, type, date, url, servings, []), 600);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,35,24,0.5)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#FFFEF9", width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: "28px 24px 40px", fontFamily: "'DM Sans',sans-serif" }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E2DAD3", margin: "-12px auto 20px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 22, color: "#2C2318", fontWeight: 500 }}>Add a Meal</div>
            <div style={{ fontSize: 12, color: "#B8A99A", marginTop: 2 }}>{fmtDay(date)}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#C8B8A8" }}>×</button>
        </div>

        {/* Meal type pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          {(MEAL_TYPES as unknown as MealType[]).map(t => (
            <button key={t} onClick={() => setType(t)}
              style={{ padding: "5px 13px", borderRadius: 20, border: type === t ? "none" : "1px solid #EDE9E3", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                background: type === t ? "#2C2318" : "white",
                color: type === t ? "white" : "#9C8B7A" }}>
              {MEAL_ICONS[t]} {MEAL_LABELS[t]}
            </button>
          ))}
        </div>

        <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
          placeholder="What's for dinner?" style={modalInput} />
        <input value={recipeUrl} onChange={e => setRecipeUrl(e.target.value)}
          placeholder="Recipe URL — ingredients & image auto-imported" style={modalInput} />
        <input type="number" value={servings} onChange={e => setServings(e.target.value)}
          placeholder="Servings" min={1} style={{ ...modalInput, width: "45%" }} />

        {parseStatus && (
          <div style={{ fontSize: 12, color: parseStatus.startsWith("✓") ? "#5C8B6A" : "#B8A99A", marginBottom: 12, textAlign: "center", fontStyle: "italic" }}>
            {parseStatus}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} disabled={parsing}
            style={{ flex: 1, padding: "13px", borderRadius: 12, border: "1px solid #EDE9E3", background: "white", color: "#9C8B7A", fontWeight: 600, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={parsing || !title.trim()}
            style={{ flex: 2, padding: "13px", borderRadius: 12, border: "none", fontWeight: 700, cursor: parsing || !title.trim() ? "not-allowed" : "pointer", fontSize: 14, fontFamily: "inherit",
              background: parsing || !title.trim() ? "#EDE9E3" : "#2C2318", color: parsing || !title.trim() ? "#B8A99A" : "white" }}>
            {parsing ? "Importing…" : "Add to Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MEAL DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function MealDetailModal({ item, onStatusChange, onDelete, onClose, onIngredientsUpdate }: {
  item: MealItem; onStatusChange: (s: string) => void;
  onDelete: () => void; onClose: () => void;
  onIngredientsUpdate?: (id: string, ingredients: string[]) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [reparseStatus, setReparseStatus] = useState<string | null>(null);
  const [localIngredients, setLocalIngredients] = useState<string[]>(item.ingredients ?? []);
  const [localStatus, setLocalStatus] = useState(item.status);

  const reparseIngredients = async () => {
    if (!item.recipe_url) return;
    setReparsing(true); setReparseStatus("Fetching ingredients…");
    try {
      const res = await fetch("/api/recipes?action=import-url", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.recipe_url }),
      });
      const data = await res.json();
      const ingredients: string[] = data.recipe?.ingredients ?? [];
      if (ingredients.length > 0) {
        setLocalIngredients(ingredients);
        setReparseStatus(`✓ ${ingredients.length} ingredients`);
        onIngredientsUpdate?.(item.id, ingredients);
      } else { setReparseStatus("No ingredients found"); }
    } catch { setReparseStatus("Couldn't reach that URL"); }
    setReparsing(false);
  };

  const STATUSES = ["planned", "prepped", "cooked", "done"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,35,24,0.5)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#FFFEF9", width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", fontFamily: "'DM Sans',sans-serif", maxHeight: "90dvh", overflowY: "auto" }}>

        {/* Hero image */}
        {item.cover_image ? (
          <div style={{ height: 180, position: "relative", borderRadius: "20px 20px 0 0", overflow: "hidden" }}>
            <img src={item.cover_image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(44,35,24,0.6))" }} />
            <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "none", borderRadius: "50%", width: 32, height: 32, fontSize: 16, cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            <div style={{ position: "absolute", bottom: 16, left: 20, right: 60 }}>
              <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 22, color: "white", fontWeight: 600, lineHeight: 1.25 }}>{item.title}</div>
              {item.meal_type && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 3 }}>{MEAL_ICONS[item.meal_type]} {MEAL_LABELS[item.meal_type]} · {item.date ? fmtDay(item.date) : ""}</div>}
            </div>
          </div>
        ) : (
          <div style={{ padding: "24px 24px 0" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E2DAD3", margin: "0 auto 18px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div>
                <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 22, color: "#2C2318", fontWeight: 500 }}>{item.title}</div>
                {item.meal_type && <div style={{ fontSize: 12, color: "#B8A99A", marginTop: 2 }}>{MEAL_ICONS[item.meal_type]} {MEAL_LABELS[item.meal_type]} · {item.date ? fmtDay(item.date) : ""}</div>}
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#C8B8A8" }}>×</button>
            </div>
          </div>
        )}

        <div style={{ padding: "20px 24px 40px" }}>
          {/* Servings + link */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid #F0EBE3" }}>
            {item.servings && <span style={{ fontSize: 13, color: "#9C8B7A" }}>👤 {item.servings} servings</span>}
            {item.recipe_url && (
              <>
                <a href={item.recipe_url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: "#C17A5A", fontWeight: 600, textDecoration: "none", letterSpacing: "0.02em" }}>View Recipe ↗</a>
                <button onClick={reparseIngredients} disabled={reparsing}
                  style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: reparsing ? "#B8A99A" : "#9C8B7A", background: "#F5F0EA", border: "none", borderRadius: 6, padding: "5px 10px", cursor: reparsing ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {reparsing ? "Parsing…" : "↻ Re-parse"}
                </button>
              </>
            )}
          </div>

          {reparseStatus && <div style={{ fontSize: 12, color: reparseStatus.startsWith("✓") ? "#5C8B6A" : "#B8A99A", marginBottom: 14, fontStyle: "italic" }}>{reparseStatus}</div>}

          {/* Status */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#B8A99A", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Status</div>
            <div style={{ display: "flex", gap: 6 }}>
              {STATUSES.map(s => (
                <button key={s} onClick={() => { setLocalStatus(s); onStatusChange(s); }}
                  style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: localStatus === s ? "none" : "1px solid #EDE9E3", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                    background: localStatus === s ? "#2C2318" : "white",
                    color: localStatus === s ? "white" : "#9C8B7A" }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          {localIngredients.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#B8A99A", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Ingredients</div>
              <div style={{ columns: 2, gap: 12 }}>
                {localIngredients.slice(0, 12).map((ing, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#6B5A4A", lineHeight: 1.9, display: "flex", alignItems: "center", gap: 6, breakInside: "avoid" }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#C17A5A", flexShrink: 0, display: "inline-block" }} />
                    {ing}
                  </div>
                ))}
              </div>
              {localIngredients.length > 12 && <div style={{ fontSize: 11, color: "#B8A99A", marginTop: 6, fontStyle: "italic" }}>+{localIngredients.length - 12} more…</div>}
            </div>
          )}
          {!localIngredients.length && item.recipe_url && (
            <div style={{ fontSize: 12, color: "#B8A99A", marginBottom: 18, fontStyle: "italic" }}>No ingredients imported yet — tap ↻ Re-parse above.</div>
          )}

          {/* Delete */}
          {confirmDelete ? (
            <div style={{ background: "#FDF6F3", borderRadius: 10, padding: 14, marginTop: 8 }}>
              <div style={{ fontSize: 13, color: "#2C2318", fontFamily: "Cormorant Garamond, Georgia, serif", marginBottom: 10 }}>Remove this meal from your plan?</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: 9, borderRadius: 8, border: "1px solid #EDE9E3", background: "white", color: "#9C8B7A", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Cancel</button>
                <button onClick={onDelete} style={{ flex: 1, padding: 9, borderRadius: 8, border: "none", background: "#C0392B", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>Remove</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              style={{ width: "100%", padding: 11, borderRadius: 10, border: "1px solid #EDE9E3", background: "none", color: "#C8B8A8", fontSize: 13, cursor: "pointer", marginTop: 8, fontFamily: "inherit" }}>
              Remove from plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GROCERY PANEL
// ─────────────────────────────────────────────────────────────────────────────
function GroceryPanel({ groceryList, weekLabel, items }: {
  groceryList: string[]; weekLabel: string; items: MealItem[];
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copyDone, setCopyDone] = useState(false);
  const unchecked = groceryList.filter(i => !checked.has(i));

  const openOnInstacart = () => {
    if (!unchecked.length) return;
    navigator.clipboard.writeText(unchecked.join("\n")).catch(() => {});
    window.open(`https://www.instacart.com/store/s?k=${encodeURIComponent(unchecked[0])}`, "_blank");
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 4000);
  };

  const copyList = () => {
    navigator.clipboard.writeText(unchecked.join("\n"));
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  };

  const toggleCheck = (item: string) => {
    setChecked(prev => { const n = new Set(prev); n.has(item) ? n.delete(item) : n.add(item); return n; });
  };

  // Group by first letter
  const grouped: Record<string, string[]> = {};
  groceryList.forEach(item => {
    const letter = item[0]?.toUpperCase() ?? "#";
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(item);
  });

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 32, color: "#2C2318", fontWeight: 500, marginBottom: 4 }}>Grocery List</div>
        <div style={{ fontSize: 13, color: "#B8A99A", fontStyle: "italic" }}>{weekLabel}</div>
        {groceryList.length > 0 && (
          <div style={{ fontSize: 13, color: "#9C8B7A", marginTop: 6 }}>
            {unchecked.length} of {groceryList.length} remaining
          </div>
        )}
      </div>

      {groceryList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#B8A99A" }}>
          <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 24, marginBottom: 8, fontStyle: "italic" }}>Your list is empty</div>
          <div style={{ fontSize: 13 }}>Plan some meals first and their ingredients will appear here.</div>
        </div>
      ) : (
        <>
          {/* Grouped list */}
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #EDE9E3", padding: "8px 24px 20px", marginBottom: 16 }}>
            {Object.keys(grouped).sort().map(letter => (
              <div key={letter}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#C17A5A", letterSpacing: "0.15em", textTransform: "uppercase", padding: "14px 0 6px", borderBottom: "1px solid #F5F0EA", marginBottom: 4 }}>{letter}</div>
                {grouped[letter].map(item => (
                  <div key={item} onClick={() => toggleCheck(item)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", cursor: "pointer", borderBottom: "1px solid #FAF7F4" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, border: checked.has(item) ? "none" : "1.5px solid #D4C8BC", background: checked.has(item) ? "#5C8B6A" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {checked.has(item) && <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 14, color: checked.has(item) ? "#C8B8A8" : "#2C2318", textDecoration: checked.has(item) ? "line-through" : "none" }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <button onClick={openOnInstacart} disabled={!unchecked.length}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", borderRadius: 12, border: "none", cursor: unchecked.length ? "pointer" : "not-allowed", background: unchecked.length ? "#43B02A" : "#EDE9E3", color: unchecked.length ? "white" : "#B8A99A", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}>
              🛒 Shop on Instacart
            </button>
            <button onClick={copyList} disabled={!unchecked.length}
              style={{ padding: "13px 18px", borderRadius: 12, border: "1px solid #EDE9E3", background: "white", color: "#9C8B7A", fontWeight: 600, fontSize: 13, cursor: unchecked.length ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
              {copyDone ? "✓ Copied" : "Copy"}
            </button>
          </div>
          {copyDone && (
            <div style={{ fontSize: 12, color: "#5C8B6A", background: "#F0F7F2", borderRadius: 8, padding: "8px 14px", textAlign: "center", fontStyle: "italic" }}>
              Full list copied to clipboard
            </div>
          )}
        </>
      )}

      {/* Per-meal breakdown */}
      {items.filter(i => (i.ingredients ?? []).length > 0).length > 0 && (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #EDE9E3", padding: "16px 24px", marginTop: 16 }}>
          <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 16, color: "#2C2318", marginBottom: 14, fontWeight: 500 }}>By Meal</div>
          {items.filter(i => (i.ingredients ?? []).length > 0).map(meal => (
            <div key={meal.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #F5F0EA" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2318" }}>{meal.title}</div>
                <button onClick={() => window.open(`https://www.instacart.com/store/s?k=${encodeURIComponent((meal.ingredients ?? [])[0] ?? meal.title)}`, "_blank")}
                  style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, border: "none", background: "#43B02A", color: "white", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Shop</button>
              </div>
              <div style={{ fontSize: 12, color: "#9C8B7A" }}>{(meal.ingredients ?? []).slice(0, 6).join(" · ")}{(meal.ingredients ?? []).length > 6 ? ` +${(meal.ingredients ?? []).length - 6}` : ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECIPE SEARCH PANEL — same logic, restyled
// ─────────────────────────────────────────────────────────────────────────────
function RecipeSearchPanel({ onAddToPlanner, weekDates }: {
  onAddToPlanner: (recipe: ImportedRecipe, date: string, mealType: MealType) => void;
  weekDates: string[];
}) {
  const [tab, setTab] = useState<"ingredients" | "photo" | "url">("ingredients");
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [results, setResults] = useState<RecipeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importedRecipe, setImportedRecipe] = useState<ImportedRecipe | null>(null);
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [photoIngredients, setPhotoIngredients] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<ImportedRecipe | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const addIngredient = (val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (trimmed && !ingredients.includes(trimmed)) setIngredients(prev => [...prev, trimmed]);
    setIngredientInput("");
  };

  const searchRecipes = async () => {
    const list = tab === "photo" ? photoIngredients : ingredients;
    if (!list.length) return;
    setSearching(true); setError(""); setResults([]);
    try {
      const res = await fetch("/api/recipes?action=search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ingredients: list, number: 8 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results);
    } catch (e: any) { setError(e.message ?? "Search failed"); }
    setSearching(false);
  };

  const analyzePhoto = async (file: File) => {
    setPhotoAnalyzing(true); setError(""); setPhotoIngredients([]);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch("/api/recipes?action=analyze-photo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: base64, mediaType: file.type }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhotoIngredients(data.ingredients);
    } catch (e: any) { setError(e.message ?? "Photo analysis failed"); }
    setPhotoAnalyzing(false);
  };

  const importRecipe = async () => {
    if (!importUrl.trim()) return;
    setImporting(true); setError(""); setImportedRecipe(null);
    try {
      const res = await fetch("/api/recipes?action=import-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: importUrl.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImportedRecipe(data.recipe);
    } catch (e: any) { setError(e.message ?? "Import failed"); }
    setImporting(false);
  };

  const loadRecipeDetail = async (result: RecipeResult) => {
    try {
      const res = await fetch("/api/recipes?action=recipe-detail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: result.id }) });
      const data = await res.json();
      if (res.ok) setSelectedRecipe({ title: data.recipe.title, servings: data.recipe.servings, readyInMinutes: data.recipe.readyInMinutes, ingredients: data.recipe.extendedIngredients?.map((i: any) => i.original) ?? [], instructions: data.recipe.analyzedInstructions?.[0]?.steps?.map((s: any) => s.step) ?? [], summary: data.recipe.summary?.replace(/<[^>]+>/g, ""), image: data.recipe.image, sourceUrl: data.recipe.sourceUrl });
    } catch {}
  };

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid #EDE9E3" }}>
        {[["ingredients","By Ingredient"],["photo","Fridge Photo"],["url","Import URL"]].map(([t, label]) => (
          <button key={t} onClick={() => { setTab(t as any); setError(""); setResults([]); setImportedRecipe(null); setSelectedRecipe(null); }}
            style={{ flex: 1, padding: "12px 6px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
              color: tab === t ? "#2C2318" : "#B8A99A",
              borderBottom: tab === t ? "2px solid #2C2318" : "2px solid transparent",
              marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Ingredient tab */}
      {tab === "ingredients" && (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #EDE9E3", padding: 24, marginBottom: 16 }}>
          <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 22, color: "#2C2318", marginBottom: 4, fontWeight: 500 }}>What's in your kitchen?</div>
          <p style={{ fontSize: 13, color: "#B8A99A", marginBottom: 18, fontStyle: "italic" }}>Add ingredients you want to use up</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input value={ingredientInput} onChange={e => setIngredientInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addIngredient(ingredientInput); }}}
              placeholder="e.g. chicken, spinach, garlic…"
              style={searchInput} />
            <button onClick={() => addIngredient(ingredientInput)}
              style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "#2C2318", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Add
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
            {ingredients.map(ing => (
              <span key={ing} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 20, background: "#F5EDE8", color: "#8B5E3C", fontSize: 12, fontWeight: 600 }}>
                {ing}
                <button onClick={() => setIngredients(p => p.filter(x => x !== ing))} style={{ background: "none", border: "none", cursor: "pointer", color: "#C17A5A", fontSize: 14, padding: 0 }}>×</button>
              </span>
            ))}
          </div>
          <button onClick={searchRecipes} disabled={!ingredients.length || searching}
            style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: ingredients.length ? "#2C2318" : "#EDE9E3", color: ingredients.length ? "white" : "#B8A99A", fontWeight: 700, fontSize: 14, cursor: ingredients.length ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            {searching ? "Searching…" : `Find Recipes`}
          </button>
        </div>
      )}

      {/* Photo tab */}
      {tab === "photo" && (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #EDE9E3", padding: 24, marginBottom: 16 }}>
          <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 22, color: "#2C2318", marginBottom: 4, fontWeight: 500 }}>Snap your fridge</div>
          <p style={{ fontSize: 13, color: "#B8A99A", marginBottom: 20, fontStyle: "italic" }}>We'll identify ingredients and suggest what to make</p>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) analyzePhoto(e.target.files[0]); }} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) analyzePhoto(e.target.files[0]); }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            <button onClick={() => cameraRef.current?.click()} disabled={photoAnalyzing}
              style={{ padding: "18px", borderRadius: 12, border: "1.5px dashed #D4C8BC", background: "#FAF7F4", color: "#6B5A4A", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              {photoAnalyzing ? "Analyzing…" : "📷 Camera"}
            </button>
            <button onClick={() => fileRef.current?.click()} disabled={photoAnalyzing}
              style={{ padding: "18px", borderRadius: 12, border: "1.5px dashed #D4C8BC", background: "#FAF7F4", color: "#6B5A4A", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              {photoAnalyzing ? "Analyzing…" : "🖼️ Upload"}
            </button>
          </div>
          {photoIngredients.length > 0 && (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {photoIngredients.map((ing, i) => (
                  <span key={i} style={{ padding: "5px 12px", borderRadius: 20, background: "#F5EDE8", color: "#8B5E3C", fontSize: 12, fontWeight: 600 }}>{ing}</span>
                ))}
              </div>
              <button onClick={searchRecipes} disabled={searching}
                style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "#2C2318", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                {searching ? "Searching…" : "Find Recipes"}
              </button>
            </>
          )}
        </div>
      )}

      {/* URL tab */}
      {tab === "url" && (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #EDE9E3", padding: 24, marginBottom: 16 }}>
          <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 22, color: "#2C2318", marginBottom: 4, fontWeight: 500 }}>Import a Recipe</div>
          <p style={{ fontSize: 13, color: "#B8A99A", marginBottom: 18, fontStyle: "italic" }}>Works with most cooking sites and Pinterest pins</p>
          <input value={importUrl} onChange={e => setImportUrl(e.target.value)} onKeyDown={e => { if (e.key === "Enter") importRecipe(); }}
            placeholder="https://everydayparisian.com/…  or pinterest.com/pin/…"
            style={searchInput} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
            {["Everyday Parisian", "Pinterest", "NYT Cooking", "Serious Eats", "Bon Appétit"].map(site => (
              <span key={site} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#F5F0EA", color: "#9C8B7A" }}>✓ {site}</span>
            ))}
          </div>
          <button onClick={importRecipe} disabled={!importUrl.trim() || importing}
            style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: importUrl.trim() ? "#2C2318" : "#EDE9E3", color: importUrl.trim() ? "white" : "#B8A99A", fontWeight: 700, fontSize: 14, cursor: importUrl.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            {importing ? "Importing…" : "Import Recipe"}
          </button>
          {importedRecipe && (
            <div style={{ marginTop: 20 }}>
              {importedRecipe.image && <img src={importedRecipe.image} alt={importedRecipe.title} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, marginBottom: 12 }} />}
              <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 18, color: "#2C2318", marginBottom: 4 }}>{importedRecipe.title}</div>
              {importedRecipe.readyInMinutes && <div style={{ fontSize: 12, color: "#B8A99A", marginBottom: 10 }}>⏱ {importedRecipe.readyInMinutes} min · 👤 {importedRecipe.servings} servings</div>}
              <SchedulePicker weekDates={weekDates} recipe={importedRecipe} onSchedule={onAddToPlanner} />
            </div>
          )}
        </div>
      )}

      {error && <div style={{ background: "#FDF6F3", border: "1px solid #E8D5C4", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#8B5E3C", fontStyle: "italic" }}>⚠️ {error}</div>}

      {/* Results grid */}
      {results.length > 0 && (
        <div>
          <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 20, color: "#2C2318", marginBottom: 16, fontWeight: 500 }}>{results.length} Recipes Found</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 }}>
            {results.map(r => (
              <div key={r.id} className="recipe-card" onClick={() => loadRecipeDetail(r)}
                style={{ background: "white", borderRadius: 12, border: "1px solid #EDE9E3", overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                {r.image && <img src={r.image} alt={r.title} style={{ width: "100%", height: 130, objectFit: "cover" }} />}
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2318", lineHeight: 1.35, marginBottom: 8 }}>{r.title}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#F0F7F2", color: "#5C8B6A", fontWeight: 600 }}>✓ {r.usedIngredientCount} have</span>
                    {r.missedIngredientCount > 0 && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#FEF3E8", color: "#8B6A3C", fontWeight: 600 }}>+ {r.missedIngredientCount} need</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedRecipe && (
        <RecipeDetailModal recipe={selectedRecipe} weekDates={weekDates}
          onSchedule={(date, mealType) => { onAddToPlanner(selectedRecipe, date, mealType); setSelectedRecipe(null); }}
          onClose={() => setSelectedRecipe(null)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECIPE DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function RecipeDetailModal({ recipe, weekDates, onSchedule, onClose }: {
  recipe: ImportedRecipe; weekDates: string[];
  onSchedule: (date: string, mealType: MealType) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(weekDates[0] ?? new Date().toISOString().slice(0, 10));
  const [mealType, setMealType] = useState<MealType>("dinner");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,35,24,0.6)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#FFFEF9", width: "100%", maxWidth: 520, borderRadius: "20px 20px 0 0", maxHeight: "90dvh", overflowY: "auto", fontFamily: "'DM Sans',sans-serif" }}>
        {recipe.image && <img src={recipe.image} alt={recipe.title} style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: "20px 20px 0 0" }} />}
        <div style={{ padding: "24px 24px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 24, color: "#2C2318", fontWeight: 500, flex: 1, marginRight: 12 }}>{recipe.title}</div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#C8B8A8" }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 14, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #F0EBE3" }}>
            {recipe.readyInMinutes && <span style={{ fontSize: 12, color: "#9C8B7A" }}>⏱ {recipe.readyInMinutes} min</span>}
            {recipe.servings && <span style={{ fontSize: 12, color: "#9C8B7A" }}>👤 {recipe.servings} servings</span>}
            {recipe.sourceUrl && <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#C17A5A", fontWeight: 600, textDecoration: "none" }}>View original ↗</a>}
          </div>
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#B8A99A", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Ingredients</div>
              <div style={{ columns: 2, gap: 12 }}>
                {recipe.ingredients.slice(0, 10).map((ing, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#6B5A4A", lineHeight: 1.9, breakInside: "avoid", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#C17A5A", flexShrink: 0, display: "inline-block" }} />{ing}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ background: "#FAF7F4", borderRadius: 12, padding: 18 }}>
            <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 16, color: "#2C2318", marginBottom: 14 }}>Add to meal plan</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: "1px solid #EDE9E3", fontSize: 13, fontFamily: "inherit", background: "white" }} />
              <select value={mealType} onChange={e => setMealType(e.target.value as MealType)} style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: "1px solid #EDE9E3", fontSize: 13, fontFamily: "inherit", background: "white" }}>
                {(["breakfast","lunch","dinner","snack","prep"] as MealType[]).map(t => <option key={t} value={t}>{MEAL_ICONS[t]} {MEAL_LABELS[t]}</option>)}
              </select>
            </div>
            <button onClick={() => onSchedule(date, mealType)}
              style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "#2C2318", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              Add to Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULE PICKER
// ─────────────────────────────────────────────────────────────────────────────
function SchedulePicker({ weekDates, recipe, onSchedule }: {
  weekDates: string[]; recipe: ImportedRecipe;
  onSchedule: (recipe: ImportedRecipe, date: string, mealType: MealType) => void;
}) {
  const [date, setDate] = useState(weekDates[0] ?? new Date().toISOString().slice(0, 10));
  const [mealType, setMealType] = useState<MealType>("dinner");
  return (
    <div style={{ background: "#FAF7F4", borderRadius: 10, padding: 14, marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ flex: 1, padding: "8px 12px", borderRadius: 9, border: "1px solid #EDE9E3", fontSize: 13, fontFamily: "inherit", background: "white" }} />
        <select value={mealType} onChange={e => setMealType(e.target.value as MealType)} style={{ flex: 1, padding: "8px 12px", borderRadius: 9, border: "1px solid #EDE9E3", fontSize: 13, fontFamily: "inherit", background: "white" }}>
          {(["breakfast","lunch","dinner","snack","prep"] as MealType[]).map(t => <option key={t} value={t}>{MEAL_ICONS[t]} {MEAL_LABELS[t]}</option>)}
        </select>
      </div>
      <button onClick={() => onSchedule(recipe, date, mealType)}
        style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: "#2C2318", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
        Add to Plan →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const weekNavBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: "50%", border: "1px solid #EDE9E3",
  background: "white", color: "#9C8B7A", fontSize: 18, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};
const modalInput: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #EDE9E3",
  fontSize: 14, fontFamily: "inherit", color: "#2C2318", marginBottom: 10, outline: "none",
  background: "white",
};
const searchInput: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #EDE9E3",
  fontSize: 14, fontFamily: "inherit", color: "#2C2318", marginBottom: 12, outline: "none",
  background: "white",
};

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

"use client";

/**
 * Clarityboards — MealBoard Weekly Planner (Enhanced)
 * File: app/settings/meal/page.tsx
 *
 * Features:
 *  - Weekly grid planner (Mon–Sun, Breakfast / Lunch / Dinner)
 *  - Ingredient-based recipe search (Spoonacular)
 *  - Fridge photo analysis (Claude Vision → auto-fills ingredients)
 *  - Pinterest pin / any recipe URL import
 *  - Grocery list auto-generated from planned meals
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "prep"] as const;
type MealType = typeof MEAL_TYPES[number];
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "🌅 Breakfast", lunch: "☀️ Lunch", dinner: "🌙 Dinner",
  snack: "🍎 Snack", prep: "🥣 Prep",
};
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface MealItem {
  id: string; title: string; date: string | null; status: string;
  meal_type: MealType | null; recipe_url: string | null;
  ingredients: string[]; notes: string | null; servings: number | null;
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
    const { data } = await supabase.from("items").select("id,title,date,status,meal_type,recipe_url,ingredients,notes,servings")
      .eq("user_id", user.id).eq("board", "meal")
      .gte("date", weekDates[0]).lte("date", weekDates[6]).order("date", { ascending: true });
    if (data) setItems(data as MealItem[]);
    setLoading(false);
  };

  const addMeal = async (title: string, mealType: MealType, date: string, recipeUrl: string, servings: string, ingredients: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("items").insert({
      user_id: user.id, board: "meal", title: title.trim(), date, meal_type: mealType,
      status: "planned", recipe_url: recipeUrl.trim() || null,
      servings: servings ? parseInt(servings) : null,
      ingredients: ingredients.filter(Boolean), checklist: [],
    }).select().single();
    if (data) setItems(prev => [...prev, data as MealItem].sort((a, b) => (a.date ?? "") > (b.date ?? "") ? 1 : -1));
    setAddModal(null);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("items").update({ status }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const deleteMeal = async (id: string) => {
    await supabase.from("items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    setDetailItem(null);
  };

  const groceryList = [...new Set(items.flatMap(i => (i.ingredients ?? []).filter(Boolean)))].sort();
  const slotMeals = (date: string, mealType: MealType) => items.filter(i => i.date === date && i.meal_type === mealType);
  const weekLabel = weekDates.length ? `${fmtShort(weekDates[0])} – ${fmtShort(weekDates[6])}` : "";

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#F4F7FA" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; }
        .tab-btn { transition: all 0.15s; }
        .tab-btn:hover { opacity: 0.85; }
        .meal-chip:hover { box-shadow: 0 2px 8px rgba(192,57,43,0.2) !important; }
        .slot-add:hover { background: #FDEDEC !important; border-color: #C0392B !important; color: #C0392B !important; }
        .recipe-card:hover { border-color: #C0392B !important; box-shadow: 0 4px 16px rgba(192,57,43,0.1) !important; }
      `}</style>

      {/* Nav */}
      <div style={{ background: "#1A2B3C", padding: "0 16px", position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", height: 56, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/dashboard")} style={{ color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 8, transition: "background 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >← Dashboard</button>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#C0392B", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia,serif", color: "white", fontWeight: 700, fontSize: 14 }}>M</span>
            <span style={{ fontFamily: "'DM Serif Display',serif", color: "white", fontSize: 17, fontWeight: 600 }}>MealBoard</span>
          </div>
          {/* Mode tabs */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {[["planner","📅 Plan"],["search","🔍 Recipes"],["grocery","🛒 List"]] .map(([m, label]) => (
              <button key={m} className="tab-btn" onClick={() => setMode(m as any)}
                style={{ padding: "6px 12px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: mode === m ? "#C0392B" : "rgba(255,255,255,0.08)", color: "white" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 80px" }}>

        {/* ── RECIPE SEARCH MODE ── */}
        {mode === "search" && (
          <RecipeSearchPanel onAddToPlanner={(recipe, date, mealType) => {
            addMeal(recipe.title, mealType, date, recipe.sourceUrl ?? "", String(recipe.servings ?? ""), recipe.ingredients ?? []);
            setMode("planner");
          }} weekDates={weekDates} />
        )}

        {/* ── GROCERY MODE ── */}
        {mode === "grocery" && (
          <GroceryPanel groceryList={groceryList} weekLabel={weekLabel} items={items} />
        )}

        {/* ── PLANNER MODE ── */}
        {mode === "planner" && (<>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button onClick={() => setWeekOffset(o => o - 1)} style={navBtn}>‹ Prev</button>
            <div style={{ flex: 1, textAlign: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#1A2B3C" }}>{weekLabel}</span>
              {weekOffset !== 0 && (
                <button onClick={() => setWeekOffset(0)} style={{ marginLeft: 10, fontSize: 11, color: "#C0392B", background: "none", border: "1px solid #C0392B", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>
                  This week
                </button>
              )}
            </div>
            <button onClick={() => setWeekOffset(o => o + 1)} style={navBtn}>Next ›</button>
          </div>

          {loading ? <div style={{ textAlign: "center", color: "#9AABBD", paddingTop: 40 }}>Loading…</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {weekDates.map((date, di) => {
                const isToday = date === today;
                return (
                  <div key={date} style={{ background: "white", borderRadius: 14, border: isToday ? "2px solid #C0392B" : "1px solid #E8EDF5", overflow: "hidden" }}>
                    <div style={{ padding: "9px 16px", background: isToday ? "#FDEDEC" : "#F8FAFE", borderBottom: "1px solid #F0F4F8", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isToday ? "#C0392B" : "#1A2B3C" }}>{DAY_LABELS[di]}</span>
                      <span style={{ fontSize: 12, color: "#9AABBD" }}>{fmtDay(date)}</span>
                      {isToday && <span style={{ fontSize: 10, fontWeight: 700, color: "white", background: "#C0392B", borderRadius: 4, padding: "1px 6px" }}>TODAY</span>}
                    </div>
                    <div style={{ padding: "8px 12px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {(["breakfast", "lunch", "dinner"] as MealType[]).map(mealType => {
                        const meals = slotMeals(date, mealType);
                        return (
                          <div key={mealType} style={{ minHeight: 70 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "#9AABBD", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                              {MEAL_LABELS[mealType]}
                            </div>
                            {meals.map(meal => (
                              <div key={meal.id} className="meal-chip" onClick={() => setDetailItem(meal)}
                                style={{ background: meal.status === "done" ? "#F4F7FA" : "#FDEDEC", borderRadius: 8, padding: "5px 8px", marginBottom: 4, cursor: "pointer", transition: "box-shadow 0.15s" }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: meal.status === "done" ? "#9AABBD" : "#C0392B", textDecoration: meal.status === "done" ? "line-through" : "none", lineHeight: 1.3 }}>
                                  {meal.title}
                                </div>
                                {meal.servings && <div style={{ fontSize: 10, color: "#9AABBD" }}>👤 {meal.servings}</div>}
                              </div>
                            ))}
                            <button className="slot-add" onClick={() => setAddModal({ date, meal_type: mealType })}
                              style={{ width: "100%", padding: "4px", border: "1px dashed #E8EDF5", borderRadius: 8, background: "none", cursor: "pointer", fontSize: 11, color: "#9AABBD", transition: "all 0.15s" }}>
                              + Add
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

      {addModal && <AddMealModal date={addModal.date} mealType={addModal.meal_type} onSave={addMeal} onClose={() => setAddModal(null)} />}
      {detailItem && <MealDetailModal item={detailItem} onStatusChange={s => updateStatus(detailItem.id, s)} onDelete={() => deleteMeal(detailItem.id)} onClose={() => setDetailItem(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECIPE SEARCH PANEL
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
  const [scheduleTo, setScheduleTo] = useState({ date: weekDates[0] ?? "", mealType: "dinner" as MealType });
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
      const res = await fetch("/api/recipes?action=search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: list, number: 8 }),
      });
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
      const res = await fetch("/api/recipes?action=analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
      });
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
      const res = await fetch("/api/recipes?action=import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImportedRecipe(data.recipe);
    } catch (e: any) { setError(e.message ?? "Import failed"); }
    setImporting(false);
  };

  const loadRecipeDetail = async (result: RecipeResult) => {
    try {
      const res = await fetch("/api/recipes?action=recipe-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: result.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedRecipe({
          title: data.recipe.title,
          servings: data.recipe.servings,
          readyInMinutes: data.recipe.readyInMinutes,
          ingredients: data.recipe.extendedIngredients?.map((i: any) => i.original) ?? [],
          instructions: data.recipe.analyzedInstructions?.[0]?.steps?.map((s: any) => s.step) ?? [],
          summary: data.recipe.summary?.replace(/<[^>]+>/g, ""),
          image: data.recipe.image,
          sourceUrl: data.recipe.sourceUrl,
        });
      }
    } catch {}
  };

  const scheduleSelected = () => {
    if (!selectedRecipe && !importedRecipe) return;
    onAddToPlanner(selectedRecipe ?? importedRecipe!, scheduleTo.date, scheduleTo.mealType);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "white", borderRadius: 14, border: "1px solid #E8EDF5", padding: 6 }}>
        {[
          ["ingredients", "🥕 By Ingredient"],
          ["photo", "📸 Fridge Photo"],
          ["url", "🔗 Import URL"],
        ].map(([t, label]) => (
          <button key={t} onClick={() => { setTab(t as any); setError(""); setResults([]); setImportedRecipe(null); setSelectedRecipe(null); }}
            style={{ flex: 1, padding: "9px 6px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: tab === t ? "#C0392B" : "transparent", color: tab === t ? "white" : "#5A7A94" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── INGREDIENT TAB ── */}
      {tab === "ingredients" && (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #E8EDF5", padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1A2B3C" }}>What's in your kitchen?</h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "#9AABBD" }}>Add ingredients you want to use up and we'll find matching recipes</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input value={ingredientInput} onChange={e => setIngredientInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addIngredient(ingredientInput); }}}
              placeholder="e.g. chicken, spinach, garlic…"
              style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid #E8EDF5", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
            <button onClick={() => addIngredient(ingredientInput)}
              style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: "#1A2B3C", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Add
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {ingredients.map(ing => (
              <span key={ing} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: "#FDEDEC", color: "#C0392B", fontSize: 12, fontWeight: 600 }}>
                {ing}
                <button onClick={() => setIngredients(p => p.filter(x => x !== ing))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#C0392B", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
              </span>
            ))}
          </div>
          <button onClick={searchRecipes} disabled={!ingredients.length || searching}
            style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: ingredients.length ? "#C0392B" : "#E8EDF5", color: ingredients.length ? "white" : "#9AABBD", fontWeight: 700, fontSize: 14, cursor: ingredients.length ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            {searching ? "Searching…" : `Find Recipes (${ingredients.length} ingredient${ingredients.length !== 1 ? "s" : ""})`}
          </button>
        </div>
      )}

      {/* ── PHOTO TAB ── */}
      {tab === "photo" && (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #E8EDF5", padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1A2B3C" }}>Snap your fridge or pantry</h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "#9AABBD" }}>We'll identify the ingredients and find recipes you can make</p>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) analyzePhoto(e.target.files[0]); }} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) analyzePhoto(e.target.files[0]); }} />
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <button onClick={() => cameraRef.current?.click()} disabled={photoAnalyzing}
              style={{ flex: 1, padding: "14px", borderRadius: 12, border: "2px dashed #E8EDF5", background: "#F8FAFE", color: "#1A2B3C", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              {photoAnalyzing ? "🔍 Analyzing…" : "📷 Take Photo"}
            </button>
            <button onClick={() => fileRef.current?.click()} disabled={photoAnalyzing}
              style={{ flex: 1, padding: "14px", borderRadius: 12, border: "2px dashed #E8EDF5", background: "#F8FAFE", color: "#1A2B3C", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              {photoAnalyzing ? "🔍 Analyzing…" : "🖼️ Upload Photo"}
            </button>
          </div>
          {photoAnalyzing && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#C0392B" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Claude is identifying your ingredients…</div>
            </div>
          )}
          {photoIngredients.length > 0 && (<>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#5A7A94", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Found {photoIngredients.length} ingredients
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {photoIngredients.map((ing, i) => (
                  <span key={i} style={{ padding: "4px 10px", borderRadius: 20, background: "#FDEDEC", color: "#C0392B", fontSize: 12, fontWeight: 600 }}>
                    {ing}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={searchRecipes} disabled={searching}
              style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: "#C0392B", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              {searching ? "Searching…" : "Find Recipes with These Ingredients"}
            </button>
          </>)}
        </div>
      )}

      {/* ── URL TAB ── */}
      {tab === "url" && (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #E8EDF5", padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1A2B3C" }}>Import a recipe</h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "#9AABBD" }}>Paste any recipe URL — works with most cooking sites and Pinterest pins</p>
          <div style={{ marginBottom: 8 }}>
            <input value={importUrl} onChange={e => setImportUrl(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") importRecipe(); }}
              placeholder="https://www.seriouseats.com/... or pinterest.com/pin/..."
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E8EDF5", fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 10 }} />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {["Pinterest pin", "NYT Cooking link", "AllRecipes", "Serious Eats", "Bon Appétit"].map(site => (
              <span key={site} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#EBF3FB", color: "#2874A6" }}>✓ {site}</span>
            ))}
          </div>
          <button onClick={importRecipe} disabled={!importUrl.trim() || importing}
            style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: importUrl.trim() ? "#C0392B" : "#E8EDF5", color: importUrl.trim() ? "white" : "#9AABBD", fontWeight: 700, fontSize: 14, cursor: importUrl.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            {importing ? "Importing…" : "Import Recipe"}
          </button>

          {importedRecipe && (
            <div style={{ marginTop: 20, padding: 16, borderRadius: 12, border: "1px solid #C0392B", background: "#FDEDEC" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#C0392B", marginBottom: 4 }}>{importedRecipe.title}</div>
              {importedRecipe.readyInMinutes && <div style={{ fontSize: 12, color: "#5A7A94", marginBottom: 8 }}>⏱ {importedRecipe.readyInMinutes} min · 👤 {importedRecipe.servings} servings</div>}
              {importedRecipe.summary && <div style={{ fontSize: 12, color: "#5A7A94", marginBottom: 8, lineHeight: 1.5 }}>{importedRecipe.summary.slice(0, 200)}{importedRecipe.summary.length > 200 ? "…" : ""}</div>}
              <div style={{ fontSize: 12, color: "#1A2B3C", fontWeight: 600, marginBottom: 4 }}>Ingredients ({importedRecipe.ingredients?.length ?? 0})</div>
              <div style={{ fontSize: 12, color: "#5A7A94", marginBottom: 12 }}>
                {importedRecipe.ingredients?.slice(0, 5).join(" · ")}
                {(importedRecipe.ingredients?.length ?? 0) > 5 ? ` + ${(importedRecipe.ingredients?.length ?? 0) - 5} more` : ""}
              </div>
              <SchedulePicker weekDates={[]} recipe={importedRecipe} onSchedule={onAddToPlanner} />
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "#FFF5F5", border: "1px solid #FDEDEC", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#C0392B" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Search results */}
      {results.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#5A7A94", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {results.length} Recipes Found
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {results.map(r => (
              <div key={r.id} className="recipe-card" onClick={() => loadRecipeDetail(r)}
                style={{ background: "white", borderRadius: 12, border: "1px solid #E8EDF5", overflow: "hidden", cursor: "pointer", transition: "all 0.15s" }}>
                {r.image && <img src={r.image} alt={r.title} style={{ width: "100%", height: 120, objectFit: "cover" }} />}
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A2B3C", lineHeight: 1.3, marginBottom: 6 }}>{r.title}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: "#EAFAF1", color: "#27AE60", fontWeight: 600 }}>
                      ✓ {r.usedIngredientCount} used
                    </span>
                    {r.missedIngredientCount > 0 && (
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: "#FEF3E8", color: "#E67E22", fontWeight: 600 }}>
                        + {r.missedIngredientCount} needed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recipe detail modal */}
      {selectedRecipe && (
        <RecipeDetailModal recipe={selectedRecipe} weekDates={weekDates} onSchedule={(date, mealType) => {
          onAddToPlanner(selectedRecipe, date, mealType);
          setSelectedRecipe(null);
        }} onClose={() => setSelectedRecipe(null)} />
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "white", width: "100%", maxWidth: 520, borderRadius: "20px 20px 0 0", maxHeight: "90dvh", overflowY: "auto", fontFamily: "'DM Sans',sans-serif" }}>
        {recipe.image && <img src={recipe.image} alt={recipe.title} style={{ width: "100%", height: 180, objectFit: "cover" }} />}
        <div style={{ padding: "20px 20px 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1A2B3C", lineHeight: 1.3, flex: 1, marginRight: 12 }}>{recipe.title}</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9AABBD", flexShrink: 0 }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            {recipe.readyInMinutes && <span style={{ fontSize: 12, color: "#5A7A94" }}>⏱ {recipe.readyInMinutes} min</span>}
            {recipe.servings && <span style={{ fontSize: 12, color: "#5A7A94" }}>👤 {recipe.servings} servings</span>}
            {recipe.sourceUrl && <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#C0392B" }}>View original ↗</a>}
          </div>
          {recipe.summary && <p style={{ fontSize: 13, color: "#5A7A94", lineHeight: 1.6, marginBottom: 16 }}>{recipe.summary.slice(0, 300)}{recipe.summary.length > 300 ? "…" : ""}</p>}

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2B3C", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Ingredients</div>
            <ul style={{ margin: 0, padding: "0 0 0 16px", color: "#5A7A94", fontSize: 13, lineHeight: 2 }}>
              {recipe.ingredients?.slice(0, 10).map((ing, i) => <li key={i}>{ing}</li>)}
              {(recipe.ingredients?.length ?? 0) > 10 && <li style={{ color: "#9AABBD" }}>+ {(recipe.ingredients?.length ?? 0) - 10} more…</li>}
            </ul>
          </div>

          {/* Schedule */}
          <div style={{ background: "#F8FAFE", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A2B3C", marginBottom: 12 }}>Add to meal plan</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #E8EDF5", fontSize: 13, fontFamily: "inherit" }} />
              <select value={mealType} onChange={e => setMealType(e.target.value as MealType)}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #E8EDF5", fontSize: 13, fontFamily: "inherit" }}>
                {(["breakfast","lunch","dinner","snack","prep"] as MealType[]).map(t => (
                  <option key={t} value={t}>{MEAL_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <button onClick={() => onSchedule(date, mealType)}
              style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: "#C0392B", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              Add to Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULE PICKER (inline, for URL import)
// ─────────────────────────────────────────────────────────────────────────────
function SchedulePicker({ weekDates, recipe, onSchedule }: {
  weekDates: string[]; recipe: ImportedRecipe;
  onSchedule: (recipe: ImportedRecipe, date: string, mealType: MealType) => void;
}) {
  const [date, setDate] = useState(weekDates[0] ?? new Date().toISOString().slice(0, 10));
  const [mealType, setMealType] = useState<MealType>("dinner");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #C0392B", fontSize: 13, fontFamily: "inherit", background: "white" }} />
        <select value={mealType} onChange={e => setMealType(e.target.value as MealType)}
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #C0392B", fontSize: 13, fontFamily: "inherit", background: "white" }}>
          {(["breakfast","lunch","dinner","snack","prep"] as MealType[]).map(t => (
            <option key={t} value={t}>{MEAL_LABELS[t]}</option>
          ))}
        </select>
      </div>
      <button onClick={() => onSchedule(recipe, date, mealType)}
        style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: "#C0392B", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
        Add to Plan →
      </button>
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

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "white", width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: "24px 20px 32px", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1A2B3C" }}>Add Meal</div>
            <div style={{ fontSize: 12, color: "#9AABBD" }}>{fmtDay(date)}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9AABBD" }}>×</button>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {(MEAL_TYPES as unknown as MealType[]).map(t => (
            <button key={t} onClick={() => setType(t)}
              style={{ padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: type === t ? "#C0392B" : "#F4F7FA", color: type === t ? "white" : "#5A7A94" }}>
              {MEAL_LABELS[t]}
            </button>
          ))}
        </div>
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Meal name…" style={inputStyle} />
        <input value={recipeUrl} onChange={e => setRecipeUrl(e.target.value)} placeholder="Recipe URL (optional)" style={inputStyle} />
        <input type="number" value={servings} onChange={e => setServings(e.target.value)} placeholder="Servings" min={1} style={{ ...inputStyle, width: "50%" }} />
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #E8EDF5", background: "white", color: "#5A7A94", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
          <button onClick={() => { if (title.trim()) onSave(title, type, date, recipeUrl, servings, []); }}
            style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: "#C0392B", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
            Add to Plan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MEAL DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function MealDetailModal({ item, onStatusChange, onDelete, onClose }: {
  item: MealItem; onStatusChange: (s: string) => void;
  onDelete: () => void; onClose: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "white", width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: "24px 20px 32px", fontFamily: "'DM Sans',sans-serif", maxHeight: "85dvh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1A2B3C" }}>{item.title}</div>
            <div style={{ fontSize: 12, color: "#9AABBD" }}>{item.meal_type ? MEAL_LABELS[item.meal_type] : ""} · {item.date ? fmtDay(item.date) : ""}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9AABBD" }}>×</button>
        </div>
        {item.servings && <div style={{ fontSize: 13, color: "#5A7A94", marginBottom: 8 }}>👤 {item.servings} servings</div>}
        {item.recipe_url && <a href={item.recipe_url} target="_blank" rel="noreferrer" style={{ display: "block", fontSize: 13, color: "#C0392B", marginBottom: 12, wordBreak: "break-all" }}>🔗 View Recipe ↗</a>}
        {item.ingredients?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2B3C", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Ingredients</div>
            <div style={{ fontSize: 12, color: "#5A7A94", lineHeight: 2 }}>{item.ingredients.slice(0, 8).join(" · ")}{item.ingredients.length > 8 ? ` + ${item.ingredients.length - 8} more` : ""}</div>
          </div>
        )}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#9AABBD", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Status</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["planned","prepped","cooked","done"].map(s => (
              <button key={s} onClick={() => onStatusChange(s)}
                style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: item.status === s ? "#C0392B" : "#F4F7FA", color: item.status === s ? "white" : "#5A7A94" }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {confirmDelete ? (
          <div style={{ background: "#FFF5F5", borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "#C0392B", fontWeight: 600, marginBottom: 8 }}>Remove this meal?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #E8EDF5", background: "white", color: "#5A7A94", cursor: "pointer", fontSize: 12 }}>Cancel</button>
              <button onClick={onDelete} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none", background: "#C0392B", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Remove</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #FDEDEC", background: "none", color: "#C0392B", fontSize: 13, cursor: "pointer" }}>
            Remove from plan
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GROCERY PANEL (with Instacart deep-link)
// ─────────────────────────────────────────────────────────────────────────────
function GroceryPanel({ groceryList, weekLabel, items }: {
  groceryList: string[]; weekLabel: string; items: MealItem[];
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copyDone, setCopyDone] = useState(false);

  const unchecked = groceryList.filter(i => !checked.has(i));

  // Build an Instacart search URL for the full list.
  // Strategy: open a single Instacart search for the first item, with the
  // rest as a newline-separated list copied to clipboard (best we can do
  // without an API key — IDP proper handles multi-item cart building).
  const openOnInstacart = () => {
    if (!unchecked.length) return;
    // Encode each ingredient as a separate search — open the first one and
    // copy the full list so the user can paste into the Instacart search bar.
    const listText = unchecked.join("\n");
    navigator.clipboard.writeText(listText).catch(() => {});
    // Deep link to Instacart search pre-filled with first ingredient
    const searchQuery = encodeURIComponent(unchecked[0]);
    window.open(`https://www.instacart.com/store/s?k=${searchQuery}`, "_blank");
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 4000);
  };

  // Build one Instacart search URL per ingredient — open all at once
  const openAllOnInstacart = () => {
    if (!unchecked.length) return;
    unchecked.forEach((ing, i) => {
      setTimeout(() => {
        window.open(`https://www.instacart.com/store/s?k=${encodeURIComponent(ing)}`, "_blank");
      }, i * 300); // stagger to avoid pop-up blockers
    });
  };

  // Copy full list as plain text
  const copyList = () => {
    navigator.clipboard.writeText(unchecked.join("\n"));
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  };

  const toggleCheck = (item: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  };

  return (
    <div>
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E8EDF5", padding: 24, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1A2B3C", margin: 0 }}>🛒 Grocery List</h2>
          {groceryList.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#9AABBD", background: "#F4F7FA", borderRadius: 6, padding: "3px 8px" }}>
              {unchecked.length} remaining
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: "#9AABBD", margin: "0 0 20px" }}>
          Ingredients from this week's plan · {weekLabel}
        </p>

        {groceryList.length === 0 ? (
          <div style={{ textAlign: "center", color: "#9AABBD", padding: "32px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🥦</div>
            <div>Plan some meals first and their ingredients will appear here</div>
          </div>
        ) : (<>
          <div style={{ columns: 2, gap: 16, marginBottom: 24 }}>
            {groceryList.map((item) => (
              <GroceryCheckItem key={item} label={item} checked={checked.has(item)} onToggle={() => toggleCheck(item)} />
            ))}
          </div>

          {/* Instacart CTA */}
          <div style={{ borderTop: "1px solid #F0F4F8", paddingTop: 20 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button onClick={openOnInstacart} disabled={!unchecked.length}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "12px 16px", borderRadius: 12, border: "none", cursor: unchecked.length ? "pointer" : "not-allowed",
                  background: unchecked.length ? "#43B02A" : "#E8EDF5", color: unchecked.length ? "white" : "#9AABBD",
                  fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Shop on Instacart
              </button>
              <button onClick={copyList} disabled={!unchecked.length}
                style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #E8EDF5", background: "white",
                  color: "#5A7A94", fontWeight: 600, fontSize: 13, cursor: unchecked.length ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                {copyDone ? "✓ Copied" : "Copy list"}
              </button>
            </div>
            {copyDone && (
              <div style={{ fontSize: 12, color: "#27AE60", background: "#EAFAF1", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                ✓ Full list copied to clipboard — paste it in Instacart's search to find everything at once
              </div>
            )}
            <p style={{ fontSize: 11, color: "#B0BEC5", textAlign: "center", margin: "10px 0 0" }}>
              Opens Instacart in a new tab · tick items off as you shop
            </p>
          </div>
        </>)}
      </div>

      {/* Per-meal breakdown */}
      {items.length > 0 && (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #E8EDF5", padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#5A7A94", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>
            Shop by meal
          </div>
          {items.filter(i => (i.ingredients ?? []).length > 0).map(meal => (
            <div key={meal.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #F0F4F8" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1A2B3C" }}>{meal.title}</span>
                  {meal.date && <span style={{ fontSize: 11, color: "#9AABBD", marginLeft: 8 }}>{fmtShort(meal.date)}</span>}
                </div>
                <button onClick={() => {
                  const q = encodeURIComponent((meal.ingredients ?? [])[0] ?? meal.title);
                  window.open(`https://www.instacart.com/store/s?k=${q}`, "_blank");
                }} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, border: "none", background: "#43B02A",
                  color: "white", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Shop
                </button>
              </div>
              <div style={{ fontSize: 12, color: "#5A7A94" }}>{(meal.ingredients ?? []).slice(0, 6).join(" · ")}{(meal.ingredients ?? []).length > 6 ? ` +${(meal.ingredients ?? []).length - 6} more` : ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GROCERY CHECK ITEM
// ─────────────────────────────────────────────────────────────────────────────
function GroceryCheckItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer", breakInside: "avoid" }}>
      <div style={{ width: 20, height: 20, borderRadius: 5, border: checked ? "none" : "2px solid #D4E6F1", background: checked ? "#27AE60" : "none", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {checked && <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>✓</span>}
      </div>
      <span style={{ fontSize: 13, color: checked ? "#9AABBD" : "#1A2B3C", textDecoration: checked ? "line-through" : "none" }}>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const navBtn: React.CSSProperties = {
  padding: "7px 16px", borderRadius: 8, border: "1px solid #E8EDF5",
  background: "white", color: "#5A7A94", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E8EDF5",
  fontSize: 14, fontFamily: "inherit", color: "#1A2B3C", marginBottom: 10, outline: "none",
};

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

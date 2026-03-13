"use client";

/**
 * Clarityboards — Global Search
 * File: components/GlobalSearch.tsx
 *
 * A keyboard-accessible search modal that finds items across all boards.
 * Triggered by clicking the search icon or pressing Cmd/Ctrl+K.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { BOARD_MAP } from "@/lib/boards";

interface SearchResult {
  id: string;
  board: string;
  title: string;
  date: string | null;
  status: string;
  notes: string | null;
}

interface GlobalSearchProps {
  onSelectItem: (board: string, itemId: string) => void;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  "todo": "To Do", "in-progress": "In Progress", "done": "Done",
  "submitted": "Submitted", "applied": "Applied",
  "rsvp-needed": "RSVP Needed", "accepted": "Accepted", "declined": "Declined",
};

export default function GlobalSearch({ onSelectItem, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && results[selected]) {
        onSelectItem(results[selected].board, results[selected].id);
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [results, selected, onSelectItem, onClose]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("items")
      .select("id, board, title, date, status, notes")
      .eq("user_id", user.id)
      .not("title", "like", "__boards__%")
      .or(`title.ilike.%${q}%,notes.ilike.%${q}%`)
      .order("date", { ascending: true })
      .limit(20);

    setResults(data ?? []);
    setSelected(0);
    setLoading(false);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 250);
  };

  const highlight = (text: string, q: string) => {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: "#FFF3CD", borderRadius: 3, padding: "0 1px" }}>{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(26,43,60,0.5)", zIndex: 9000, backdropFilter: "blur(2px)" }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "12%", left: "50%", transform: "translateX(-50%)",
        zIndex: 9001, width: "calc(100% - 32px)", maxWidth: 560,
        background: "white", borderRadius: 18,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        overflow: "hidden",
      }}>
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid #F0F4F8" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            placeholder="Search across all boards…"
            style={{
              flex: 1, border: "none", outline: "none", fontSize: 16,
              color: "#1A2B3C", background: "transparent", fontFamily: "inherit",
            }}
          />
          {loading && <div style={{ fontSize: 12, color: "#9AABBD" }}>Searching…</div>}
          <kbd style={{ fontSize: 11, color: "#9AABBD", background: "#F0F4F8", borderRadius: 6, padding: "3px 7px", flexShrink: 0 }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 380, overflowY: "auto" }}>
          {query && !loading && results.length === 0 && (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "#9AABBD", fontSize: 14 }}>
              No results for "{query}"
            </div>
          )}

          {results.map((item, i) => {
            const board = BOARD_MAP[item.board as keyof typeof BOARD_MAP];
            const isSelected = i === selected;
            return (
              <div
                key={item.id}
                onClick={() => { onSelectItem(item.board, item.id); onClose(); }}
                onMouseEnter={() => setSelected(i)}
                style={{
                  padding: "12px 20px", cursor: "pointer",
                  background: isSelected ? "#EBF3FB" : "white",
                  borderBottom: "1px solid #F7FAFE",
                  transition: "background 0.1s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{
                    display: "inline-block", width: 20, height: 20, borderRadius: 6,
                    background: board?.color ?? "#9AABBD",
                    color: "white", fontSize: 10, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  } as any}>{board?.letter ?? "?"}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: board?.color ?? "#9AABBD", textTransform: "uppercase", letterSpacing: 0.5 }}>{board?.label ?? item.board}</span>
                  {item.date && <span style={{ fontSize: 11, color: "#9AABBD", marginLeft: "auto" }}>{new Date(item.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                </div>
                <div style={{ fontSize: 14, color: "#1A2B3C", fontWeight: 500, lineHeight: 1.3 }}>
                  {highlight(item.title, query)}
                </div>
                {item.notes && query && item.notes.toLowerCase().includes(query.toLowerCase()) && (
                  <div style={{ fontSize: 12, color: "#5A7A94", marginTop: 3, lineHeight: 1.4 }}>
                    {highlight(item.notes.slice(0, 80) + (item.notes.length > 80 ? "…" : ""), query)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div style={{ padding: "10px 20px", background: "#F7FAFE", borderTop: "1px solid #F0F4F8", display: "flex", gap: 16 }}>
            {[["↑↓", "navigate"], ["↵", "open"], ["esc", "close"]].map(([key, label]) => (
              <span key={key} style={{ fontSize: 11, color: "#9AABBD" }}>
                <kbd style={{ background: "#E8EDF5", borderRadius: 4, padding: "2px 5px", fontSize: 10, marginRight: 4 }}>{key}</kbd>{label}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

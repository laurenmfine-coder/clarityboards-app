"use client";

/**
 * Clarityboards — Export & Connect
 * File: app/settings/export/page.tsx
 *
 * Exports board data in three formats:
 *   - Markdown  (NotebookLM, Obsidian, Notion paste)
 *   - Plain text (universal copy/paste)
 *   - AI Prompt  (pre-formatted context block for ChatGPT, Claude, Gemini)
 *
 * Two modes:
 *   - Current board snapshot (all items or filtered by status)
 *   - Archive: completed items within a date range
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BOARDS } from "@/lib/boards";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Item {
  id: string;
  board: string;
  title: string;
  date: string | null;
  notes: string | null;
  status: string;
  checklist: { id: string; text: string; done: boolean }[];
  created_at: string;
}

type ExportFormat = "markdown" | "text" | "prompt";
type ExportMode = "snapshot" | "archive";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BOARD_MAP = Object.fromEntries(BOARDS.map(b => [b.id, b]));
const STORAGE_KEY = "cb_board_names";

function getBoardLabel(id: string): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const names = JSON.parse(saved);
      if (names[id]) return names[id];
    }
  } catch {}
  return BOARD_MAP[id]?.label ?? id;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No date";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch { return dateStr; }
}

function statusLabel(status: string): string {
  return status.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

// ─── Export generators ────────────────────────────────────────────────────────

function toMarkdown(items: Item[], boardId: string, meta: { mode: ExportMode; dateRange?: string }): string {
  const label = getBoardLabel(boardId);
  const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const modeLabel = meta.mode === "archive" ? "Completed Archive" : "Board Snapshot";

  const grouped: Record<string, Item[]> = {};
  items.forEach(item => {
    const key = item.status;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  let md = `# ${label} — ${modeLabel}\n`;
  md += `*Exported from Clarityboards on ${now}*`;
  if (meta.dateRange) md += ` · ${meta.dateRange}`;
  md += `\n\n---\n\n`;
  md += `**Total items:** ${items.length}  \n`;
  md += `**Board:** ${label}  \n\n`;

  Object.entries(grouped).forEach(([status, group]) => {
    md += `## ${statusLabel(status)} (${group.length})\n\n`;
    group.forEach(item => {
      md += `### ${item.title}\n`;
      if (item.date) md += `- **Date:** ${formatDate(item.date)}\n`;
      if (item.notes) md += `- **Notes:** ${item.notes}\n`;
      if (item.checklist?.length > 0) {
        md += `- **Checklist:**\n`;
        item.checklist.forEach(c => {
          md += `  - [${c.done ? "x" : " "}] ${c.text}\n`;
        });
      }
      md += "\n";
    });
  });

  return md.trim();
}

function toPlainText(items: Item[], boardId: string, meta: { mode: ExportMode; dateRange?: string }): string {
  const label = getBoardLabel(boardId);
  const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const modeLabel = meta.mode === "archive" ? "Completed Archive" : "Board Snapshot";

  let txt = `${label.toUpperCase()} — ${modeLabel.toUpperCase()}\n`;
  txt += `Exported from Clarityboards · ${now}`;
  if (meta.dateRange) txt += ` · ${meta.dateRange}`;
  txt += `\n${"─".repeat(50)}\n\n`;
  txt += `Total items: ${items.length}\n\n`;

  items.forEach((item, i) => {
    txt += `${i + 1}. ${item.title}\n`;
    txt += `   Status: ${statusLabel(item.status)}\n`;
    if (item.date) txt += `   Date: ${formatDate(item.date)}\n`;
    if (item.notes) txt += `   Notes: ${item.notes}\n`;
    if (item.checklist?.length > 0) {
      txt += `   Checklist:\n`;
      item.checklist.forEach(c => {
        txt += `     ${c.done ? "✓" : "○"} ${c.text}\n`;
      });
    }
    txt += "\n";
  });

  return txt.trim();
}

function toAIPrompt(items: Item[], boardId: string, meta: { mode: ExportMode; dateRange?: string }): string {
  const label = getBoardLabel(boardId);
  const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const modeLabel = meta.mode === "archive" ? "completed items archive" : "current board snapshot";
  const boardConfig = BOARDS.find(b => b.id === boardId);
  const tagline = boardConfig?.tagline ?? "";

  let prompt = `<context>\n`;
  prompt += `The following is a ${modeLabel} from Clarityboards, a family organization app.\n`;
  prompt += `Board: "${label}" — ${tagline}\n`;
  prompt += `Exported: ${now}`;
  if (meta.dateRange) prompt += ` | Date range: ${meta.dateRange}`;
  prompt += `\nTotal items: ${items.length}\n`;
  prompt += `</context>\n\n`;
  prompt += `<data>\n`;

  items.forEach(item => {
    prompt += `ITEM: ${item.title}\n`;
    prompt += `  Status: ${statusLabel(item.status)}\n`;
    if (item.date) prompt += `  Date: ${formatDate(item.date)}\n`;
    if (item.notes) prompt += `  Notes: ${item.notes}\n`;
    if (item.checklist?.length > 0) {
      const done = item.checklist.filter(c => c.done).length;
      prompt += `  Checklist: ${done}/${item.checklist.length} complete`;
      const incomplete = item.checklist.filter(c => !c.done).map(c => c.text);
      if (incomplete.length > 0) prompt += ` | Remaining: ${incomplete.join(", ")}`;
      prompt += `\n`;
    }
    prompt += `\n`;
  });

  prompt += `</data>\n\n`;
  prompt += `---\n`;
  prompt += `You can now ask questions about this data, find patterns, summarize key themes, `;
  prompt += `or use it as context for your own questions. For example:\n`;
  prompt += `• "What patterns do you notice in how we've been managing ${label}?"\n`;
  prompt += `• "Summarize the key themes from this period"\n`;
  prompt += `• "What should we prioritize next based on what's incomplete?"\n`;

  return prompt;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ExportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBoard = searchParams.get("board") || "event";

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoard, setSelectedBoard] = useState(initialBoard);
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [mode, setMode] = useState<ExportMode>("snapshot");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Load items
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/"); return; }
      supabase
        .from("items")
        .select("*")
        .eq("user_id", data.user.id)
        .not("title", "like", "__boards__%")
        .order("date", { ascending: true, nullsFirst: false })
        .then(({ data: rows }) => {
          setItems((rows ?? []) as Item[]);
          setLoading(false);
        });
    });
  }, [router]);

  // Generate export whenever params change
  const generate = useCallback(() => {
    let filtered = items.filter(i => i.board === selectedBoard);

    if (mode === "archive") {
      filtered = filtered.filter(i => i.status === "done");
      if (dateFrom) filtered = filtered.filter(i => i.date && i.date >= dateFrom);
      if (dateTo)   filtered = filtered.filter(i => i.date && i.date <= dateTo);
    } else {
      if (statusFilter !== "all") {
        filtered = filtered.filter(i => i.status === statusFilter);
      }
    }

    const dateRange = mode === "archive" && (dateFrom || dateTo)
      ? `${dateFrom ? formatDate(dateFrom) : "Beginning"} – ${dateTo ? formatDate(dateTo) : "Today"}`
      : undefined;

    const meta = { mode, dateRange };

    if (format === "markdown") setOutput(toMarkdown(filtered, selectedBoard, meta));
    else if (format === "text") setOutput(toPlainText(filtered, selectedBoard, meta));
    else setOutput(toAIPrompt(filtered, selectedBoard, meta));
  }, [items, selectedBoard, format, mode, statusFilter, dateFrom, dateTo]);

  useEffect(() => { generate(); }, [generate]);

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const ext = format === "markdown" ? "md" : format === "text" ? "txt" : "txt";
    const label = getBoardLabel(selectedBoard).replace(/\s+/g, "-");
    const modeTag = mode === "archive" ? "archive" : "snapshot";
    const filename = `clarityboards-${label}-${modeTag}-${new Date().toISOString().split("T")[0]}.${ext}`;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const itemCount = (() => {
    let filtered = items.filter(i => i.board === selectedBoard);
    if (mode === "archive") {
      filtered = filtered.filter(i => i.status === "done");
      if (dateFrom) filtered = filtered.filter(i => i.date && i.date >= dateFrom);
      if (dateTo)   filtered = filtered.filter(i => i.date && i.date <= dateTo);
    } else if (statusFilter !== "all") {
      filtered = filtered.filter(i => i.status === statusFilter);
    }
    return filtered.length;
  })();

  const boardStatuses = BOARDS.find(b => b.id === selectedBoard)?.statuses ?? [];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#F4F7FA" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        textarea { resize: none; }
        select, input { font-family: 'DM Sans', sans-serif; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.2s ease; }
        .tab-btn { border: none; cursor: pointer; transition: all 0.18s; font-family: 'DM Sans', sans-serif; }
        .tab-btn:hover { opacity: 0.85; }
      `}</style>

      {/* ── Nav ── */}
      <div style={{ background: "#1A2B3C", padding: "0 16px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", height: 56, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{ color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            ← Back
          </button>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: "'DM Serif Display', serif", color: "rgba(255,255,255,0.9)", fontSize: 16 }}>Export & Connect</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 60px", display: "flex", gap: 20, flexWrap: "wrap" }}>

        {/* ── Left panel: controls ── */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#1A2B3C", marginBottom: 6 }}>Export Your Data</div>
            <p style={{ fontSize: 13, color: "#5A7A94", lineHeight: 1.5, margin: 0 }}>
              Export any board to NotebookLM, Obsidian, ChatGPT, Claude, or any AI platform. Your data, your way.
            </p>
          </div>

          {/* Mode */}
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #E8EDF5", padding: "16px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9AABBD", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Export Mode</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {([
                { value: "snapshot", label: "📸  Board Snapshot", desc: "All current items" },
                { value: "archive",  label: "🗄️  Completed Archive", desc: "Done items by date range" },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  className="tab-btn"
                  style={{
                    textAlign: "left", padding: "10px 12px", borderRadius: 10,
                    background: mode === opt.value ? "#EBF3FB" : "#F7FAFE",
                    border: `1.5px solid ${mode === opt.value ? "#1B4F8A" : "#E8EDF5"}`,
                    color: mode === opt.value ? "#1B4F8A" : "#5A7A94",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: "#9AABBD", marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Board selector */}
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #E8EDF5", padding: "16px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9AABBD", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Board</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {BOARDS.map(b => (
                <button
                  key={b.id}
                  onClick={() => { setSelectedBoard(b.id); setStatusFilter("all"); }}
                  className="tab-btn"
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 10, textAlign: "left",
                    background: selectedBoard === b.id ? `${b.color}12` : "transparent",
                    border: `1.5px solid ${selectedBoard === b.id ? b.color : "transparent"}`,
                  }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: b.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "Georgia, serif", fontWeight: "bold", fontSize: 12, flexShrink: 0 }}>
                    {b.letter}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2B3C" }}>{getBoardLabel(b.id)}</div>
                    <div style={{ fontSize: 10, color: "#9AABBD" }}>
                      {items.filter(i => i.board === b.id).length} items
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #E8EDF5", padding: "16px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9AABBD", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
              {mode === "archive" ? "Date Range" : "Filter by Status"}
            </div>

            {mode === "snapshot" ? (
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E8EDF5", fontSize: 13, color: "#1A2B3C", background: "#F7FAFE" }}
              >
                <option value="all">All statuses</option>
                {boardStatuses.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#9AABBD", marginBottom: 4 }}>From</div>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E8EDF5", fontSize: 13, color: "#1A2B3C", background: "#F7FAFE" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#9AABBD", marginBottom: 4 }}>To</div>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E8EDF5", fontSize: 13, color: "#1A2B3C", background: "#F7FAFE" }} />
                </div>
              </div>
            )}
          </div>

          {/* Tips */}
          <div style={{ background: "#EBF3FB", borderRadius: 12, padding: "14px 16px", border: "1px solid #1B4F8A15" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1B4F8A", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Where to use this</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "📓", label: "NotebookLM", tip: "Paste as a source → ask questions across months of history" },
                { icon: "🤖", label: "ChatGPT / Claude", tip: "Use AI Prompt format → paste directly, no editing needed" },
                { icon: "📝", label: "Obsidian / Notion", tip: "Markdown format → paste into any note-taking app" },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{row.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#1B4F8A" }}>{row.label}</div>
                    <div style={{ fontSize: 11, color: "#5A7A94", lineHeight: 1.4 }}>{row.tip}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel: output ── */}
        <div style={{ flex: 1, minWidth: 300 }}>
          {/* Format tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {([
              { value: "markdown", label: "Markdown", icon: "◼" },
              { value: "text",     label: "Plain Text", icon: "≡" },
              { value: "prompt",   label: "AI Prompt", icon: "✦" },
            ] as const).map(f => (
              <button
                key={f.value}
                onClick={() => setFormat(f.value)}
                className="tab-btn"
                style={{
                  flex: 1, padding: "10px 8px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                  background: format === f.value ? "#1B4F8A" : "white",
                  color: format === f.value ? "white" : "#5A7A94",
                  border: `1.5px solid ${format === f.value ? "#1B4F8A" : "#E8EDF5"}`,
                  boxShadow: format === f.value ? "0 3px 10px rgba(27,79,138,0.25)" : "none",
                }}
              >
                <span style={{ marginRight: 5 }}>{f.icon}</span>{f.label}
              </button>
            ))}
          </div>

          {/* Output header */}
          <div style={{ background: "white", borderRadius: "14px 14px 0 0", border: "1px solid #E8EDF5", borderBottom: "none", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1A2B3C" }}>
                {getBoardLabel(selectedBoard)} · {mode === "archive" ? "Archive" : "Snapshot"}
              </span>
              <span style={{ marginLeft: 8, fontSize: 12, color: itemCount > 0 ? "#27AE60" : "#9AABBD", fontWeight: 600 }}>
                {loading ? "Loading…" : `${itemCount} item${itemCount !== 1 ? "s" : ""}`}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={download}
                style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #E8EDF5", background: "#F7FAFE", fontSize: 12, fontWeight: 700, color: "#5A7A94", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.18s" }}
              >
                {downloaded ? "✓ Saved" : "↓ Download"}
              </button>
              <button
                onClick={copy}
                style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: copied ? "#27AE60" : "#1B4F8A", fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.18s", boxShadow: "0 2px 8px rgba(27,79,138,0.3)" }}
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            readOnly
            value={loading ? "Loading your items…" : itemCount === 0 ? `No items found with the current filters.\n\nTry:\n• Selecting a different board\n• Changing the status filter\n• Widening the date range` : output}
            style={{
              width: "100%", height: 520,
              background: "#1A2B3C", color: "#E8F0FA",
              border: "1px solid #E8EDF5", borderRadius: "0 0 14px 14px",
              padding: "16px", fontSize: 12, lineHeight: 1.7,
              fontFamily: "'DM Mono', monospace",
              outline: "none", display: "block",
            }}
          />

          {/* Format hint */}
          <div style={{ marginTop: 10, fontSize: 11, color: "#9AABBD", lineHeight: 1.6 }}>
            {format === "markdown" && "✦ Best for NotebookLM, Obsidian, Notion. Upload as a source or paste into a note."}
            {format === "text" && "✦ Universal format. Works anywhere — email, docs, any note app."}
            {format === "prompt" && "✦ Ready to paste into ChatGPT, Claude, or Gemini. The context header tells the AI what it's looking at."}
          </div>
        </div>
      </div>
    </div>
  );
}

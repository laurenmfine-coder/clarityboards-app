"use client";

/**
 * Clarityboards — Templates
 * File: app/settings/templates/page.tsx
 *
 * Pre-built item collections users can load into any board in one tap.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface TemplateItem {
  title: string;
  status: string;
  notes?: string;
  days_from_now?: number; // sets a relative date
}

interface Template {
  id: string;
  label: string;
  board: string;
  icon: string;
  description: string;
  color: string;
  items: TemplateItem[];
}

const TEMPLATES: Template[] = [
  {
    id: "back-to-school",
    label: "Back to School Checklist",
    board: "task",
    icon: "🎒",
    color: "#27AE60",
    description: "Everything families need before the first day",
    items: [
      { title: "Buy school supplies", status: "todo" },
      { title: "Label all belongings", status: "todo" },
      { title: "Set up school email/portal account", status: "todo" },
      { title: "Schedule pediatrician checkup", status: "todo" },
      { title: "Order school uniform / clothes", status: "todo" },
      { title: "Review school calendar and add key dates", status: "todo" },
      { title: "Set up carpool or bus schedule", status: "todo" },
      { title: "Meet the teacher night", status: "todo", days_from_now: 14 },
    ],
  },
  {
    id: "sports-season",
    label: "Sports Season Setup",
    board: "activity",
    icon: "⚽",
    color: "#E67E22",
    description: "Practices, games, gear, and snack schedule",
    items: [
      { title: "Register for season", status: "todo" },
      { title: "Buy required gear / cleats", status: "todo" },
      { title: "Add practice schedule to calendar", status: "todo" },
      { title: "Sign up for snack schedule", status: "todo" },
      { title: "Arrange end-of-season celebration", status: "todo" },
      { title: "First practice", status: "todo", days_from_now: 3 },
      { title: "First game", status: "todo", days_from_now: 10 },
    ],
  },
  {
    id: "college-application",
    label: "College Application Tracker",
    board: "career",
    icon: "🎓",
    color: "#8E44AD",
    description: "Every step from research to decision day",
    items: [
      { title: "Research target schools and build list", status: "todo" },
      { title: "Request letters of recommendation", status: "todo" },
      { title: "Register for SAT / ACT", status: "todo" },
      { title: "Write personal statement draft", status: "todo" },
      { title: "Complete Common App profile", status: "todo" },
      { title: "Submit Early Decision application", status: "todo", days_from_now: 30 },
      { title: "Submit Regular Decision applications", status: "todo", days_from_now: 60 },
      { title: "Apply for FAFSA", status: "todo" },
      { title: "Compare financial aid offers", status: "todo" },
      { title: "Make final decision and send deposit", status: "todo" },
    ],
  },
  {
    id: "holiday-planning",
    label: "Holiday Planning",
    board: "event",
    icon: "🎄",
    color: "#1B4F8A",
    description: "Gifts, guests, travel, and everything in between",
    items: [
      { title: "Set holiday budget", status: "todo" },
      { title: "Create gift list", status: "todo" },
      { title: "Book travel / flights", status: "todo" },
      { title: "Send holiday cards", status: "todo" },
      { title: "Plan holiday menu and shopping list", status: "todo" },
      { title: "Confirm guest list and RSVPs", status: "todo" },
      { title: "Order / buy all gifts", status: "todo" },
      { title: "Wrap gifts", status: "todo" },
      { title: "Holiday gathering", status: "todo", days_from_now: 21 },
    ],
  },
  {
    id: "job-search",
    label: "Job Search Starter",
    board: "career",
    icon: "💼",
    color: "#8E44AD",
    description: "From resume polish to offer negotiation",
    items: [
      { title: "Update resume", status: "todo" },
      { title: "Update LinkedIn profile", status: "todo" },
      { title: "Write 3 tailored cover letter templates", status: "todo" },
      { title: "Identify 10 target companies", status: "todo" },
      { title: "Reach out to 5 contacts for referrals", status: "todo" },
      { title: "Apply to 3 positions this week", status: "todo", days_from_now: 7 },
      { title: "Schedule mock interview practice", status: "todo" },
      { title: "Send follow-up thank you notes after interviews", status: "todo" },
    ],
  },
  {
    id: "weekly-tasks",
    label: "Weekly Household Tasks",
    board: "task",
    icon: "🏠",
    color: "#27AE60",
    description: "A recurring weekly task foundation",
    items: [
      { title: "Groceries", status: "todo", days_from_now: 1 },
      { title: "Laundry", status: "todo", days_from_now: 2 },
      { title: "Clean bathrooms", status: "todo", days_from_now: 3 },
      { title: "Vacuum / mop floors", status: "todo", days_from_now: 4 },
      { title: "Take out trash and recycling", status: "todo", days_from_now: 5 },
      { title: "Meal prep for the week", status: "todo", days_from_now: 0 },
      { title: "Pay weekly bills check", status: "todo", days_from_now: 1 },
    ],
  },
  {
    id: "new-student",
    label: "New Student Onboarding",
    board: "study",
    icon: "📚",
    color: "#2E9E8F",
    description: "First week of school or semester checklist",
    items: [
      { title: "Get syllabi for all classes", status: "todo" },
      { title: "Add all assignment due dates to calendar", status: "todo" },
      { title: "Set up study schedule", status: "todo" },
      { title: "Buy textbooks and materials", status: "todo" },
      { title: "Join class group chats / Discord", status: "todo" },
      { title: "Locate all classrooms before Day 1", status: "todo" },
      { title: "Schedule office hours visit", status: "todo", days_from_now: 7 },
      { title: "Find tutoring resources / study groups", status: "todo" },
    ],
  },
  {
    id: "birthday-party",
    label: "Birthday Party Planner",
    board: "event",
    icon: "🎂",
    color: "#1B4F8A",
    description: "From guest list to cleanup",
    items: [
      { title: "Choose date and venue", status: "todo" },
      { title: "Set budget", status: "todo" },
      { title: "Create and send invitations", status: "todo" },
      { title: "Plan theme and decorations", status: "todo" },
      { title: "Order / bake cake", status: "todo" },
      { title: "Plan activities and games", status: "todo" },
      { title: "Buy party favors", status: "todo" },
      { title: "Confirm RSVP count", status: "todo" },
      { title: "Party day!", status: "todo", days_from_now: 21 },
      { title: "Send thank you notes", status: "todo", days_from_now: 28 },
    ],
  },
];

const BOARD_COLORS: Record<string, string> = {
  event: "#1B4F8A", study: "#2E9E8F", activity: "#E67E22", career: "#8E44AD", task: "#27AE60",
};
const BOARD_LABELS: Record<string, string> = {
  event: "EventBoard", study: "StudyBoard", activity: "ActivityBoard", career: "WorkBoard", task: "TaskBoard",
};

export default function TemplatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const boards = ["all", "event", "study", "activity", "career", "task"];
  const filtered = filter === "all" ? TEMPLATES : TEMPLATES.filter(t => t.board === filter);

  const load = async (template: Template) => {
    setLoading(template.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(null); return; }

    const today = new Date();
    const items = template.items.map(item => {
      let date = null;
      if (item.days_from_now !== undefined) {
        const d = new Date(today);
        d.setDate(d.getDate() + item.days_from_now);
        date = d.toISOString().split("T")[0];
      }
      return {
        user_id: user.id,
        board: template.board,
        title: item.title,
        status: item.status,
        notes: item.notes || null,
        date,
        checklist: [],
      };
    });

    await supabase.from("items").insert(items);
    setLoading(null);
    setDone(template.id);
    setTimeout(() => setDone(null), 3000);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#FAFAF8" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap'); * { box-sizing: border-box; }`}</style>

            <nav style={{ background: '#1A1714', borderBottom: '0.5px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 300, padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 12L6 8l4-4"/></svg>
            Dashboard
          </button>
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)' }}/>
          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'white', fontSize: 19, fontWeight: 400, letterSpacing: '0.01em' }}>
            Templates
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 16px 60px" }}>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, color: "#1A1714", marginBottom: 6 }}>Start with a template</div>
          <div style={{ fontSize: 14, color: "#5C5650" }}>Load a pre-built checklist into any board in one tap. Edit items after loading.</div>
        </div>

        {/* Board filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {boards.map(b => (
            <button key={b} onClick={() => setFilter(b)} style={{
              padding: "6px 14px", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              background: filter === b ? (b === "all" ? "#1A1714" : BOARD_COLORS[b]) : "white",
              color: filter === b ? "white" : "#5C5650",
              border: `1px solid ${filter === b ? "transparent" : "#E8EDF5"}`,
              textTransform: b === "all" ? "none" : "capitalize",
            }}>
              {b === "all" ? "All templates" : BOARD_LABELS[b]}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map(template => (
            <div key={template.id} style={{
              background: "white", borderRadius: 8, border: "1px solid #E8EDF5",
              overflow: "hidden", display: "flex", flexDirection: "column",
            }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid #F0F4F8", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `${template.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                }}>{template.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1714", lineHeight: 1.3 }}>{template.label}</div>
                  <div style={{ fontSize: 11, color: "#5C5650", marginTop: 3 }}>{template.description}</div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{
                      display: "inline-block", background: `${BOARD_COLORS[template.board]}15`,
                      color: BOARD_COLORS[template.board], fontSize: 10, fontWeight: 700,
                      padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5,
                    }}>{BOARD_LABELS[template.board]}</span>
                  </div>
                </div>
              </div>

              {/* Items preview */}
              <div style={{ padding: "12px 18px", flex: 1 }}>
                {template.items.slice(0, 4).map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, border: "2px solid #D5DDE8", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#5C5650" }}>{item.title}</span>
                  </div>
                ))}
                {template.items.length > 4 && (
                  <div style={{ fontSize: 11, color: "#9AABBD", marginTop: 2 }}>
                    +{template.items.length - 4} more items
                  </div>
                )}
              </div>

              {/* Load button */}
              <div style={{ padding: "12px 18px", borderTop: "1px solid #F0F4F8" }}>
                <button
                  onClick={() => load(template)}
                  disabled={loading === template.id}
                  style={{
                    width: "100%", padding: "10px", borderRadius: 10, border: "none",
                    background: done === template.id ? "#27AE60" : template.color,
                    color: "white", fontSize: 13, fontWeight: 700,
                    cursor: loading === template.id ? "not-allowed" : "pointer",
                    fontFamily: "inherit", transition: "background 0.2s",
                    opacity: loading === template.id ? 0.7 : 1,
                  }}
                >
                  {done === template.id ? "✓ Added to board!" : loading === template.id ? "Loading…" : `Load into ${BOARD_LABELS[template.board]}`}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

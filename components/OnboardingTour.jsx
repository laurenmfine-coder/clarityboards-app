import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────
// TOUR STEP DEFINITIONS
// Each step targets a CSS selector on the real dashboard.
// `position` hints where the tooltip should appear relative to the target.
// ─────────────────────────────────────────────
const TOUR_STEPS = [
  {
    id: "welcome",
    target: null, // centered modal, no highlight
    position: "center",
    title: "Welcome to Clarityboards 🎉",
    body: "You've got events, school, activities, career moves, and a to-do list that never quits. Clarityboards is one place for all of it. Let's take a 60-second tour.",
    cta: "Let's go →",
    icon: "✦",
    color: "#1B4F8A",
  },
  {
    id: "boards",
    target: "[data-tour='board-tabs']",
    position: "bottom",
    title: "Your Boards",
    body: "Each board is tuned for a different part of your life. EventBoard for milestones, StudyBoard for school, ActivityBoard for kids, CareerBoard for work, TaskBoard for everything else.",
    cta: "Got it →",
    icon: "🗂️",
    color: "#1B4F8A",
  },
  {
    id: "add-item",
    target: "[data-tour='add-button']",
    position: "left",
    title: "Add anything in seconds",
    body: "Hit + to add an item to any board. Give it a title, a date, a status — done. Takes about 10 seconds.",
    cta: "Nice →",
    icon: "➕",
    color: "#2E9E8F",
  },
  {
    id: "checklist",
    target: "[data-tour='checklist']",
    position: "top",
    title: "Break it down with checklists",
    body: "Every item has a built-in checklist. Add steps, check them off as you go. Watch the progress bar fill up.",
    cta: "Love it →",
    icon: "☑️",
    color: "#E67E22",
  },
  {
    id: "status",
    target: "[data-tour='status-badge']",
    position: "bottom",
    title: "Smart status tags",
    body: "Status labels are tuned to each board. EventBoard has RSVP Needed, Accepted, Declined. CareerBoard has Applied, In Progress. Not just generic 'To Do'.",
    cta: "Smart →",
    icon: "🏷️",
    color: "#8E44AD",
  },
  {
    id: "unified",
    target: "[data-tour='unified-feed']",
    position: "top",
    title: "Everything in one feed",
    body: "Switch to All Boards view to see every item from every board, sorted by date. One scroll to know what's coming up across your whole life.",
    cta: "Wow →",
    icon: "🔀",
    color: "#1B4F8A",
  },
  {
    id: "upgrade",
    target: "[data-tour='upgrade-banner']",
    position: "top",
    title: "Want all 5 boards?",
    body: "You're on the Free plan with 2 boards. Upgrade to Pro for $4.99/mo (or $49.99/yr) to unlock all 5 boards plus SMS and email forwarding — coming soon.",
    cta: "Got it →",
    icon: "⭐",
    color: "#27AE60",
  },
  {
    id: "done",
    target: null,
    position: "center",
    title: "You're all set! 🚀",
    body: "That's Clarityboards. Add your first real item, check off a task, or just explore. You can replay this tour anytime from the Help menu.",
    cta: "Start using Clarityboards",
    icon: "🎉",
    color: "#1B4F8A",
  },
];

// ─────────────────────────────────────────────
// MOCK DASHBOARD (simulates the real app)
// In production, replace this with the real dashboard DOM.
// The data-tour attributes are what the tour hooks into.
// ─────────────────────────────────────────────
const BOARDS_CONFIG = [
  { id: "event", label: "EventBoard", letter: "E", color: "#1B4F8A", emoji: "🎉" },
  { id: "study", label: "StudyBoard", letter: "S", color: "#2E9E8F", emoji: "📚" },
  { id: "activity", label: "ActivityBoard", letter: "A", color: "#E67E22", emoji: "⚽" },
  { id: "career", label: "CareerBoard", letter: "C", color: "#8E44AD", emoji: "💼" },
  { id: "task", label: "TaskBoard", letter: "T", color: "#27AE60", emoji: "✅" },
];

const MOCK_ITEMS = [
  { title: "Emma's Bat Mitzvah", date: "Mar 28", board: "event", status: "RSVP Needed", color: "#1B4F8A", checklist: ["RSVP by deadline", "Order gift", "Babysitter", "Outfit"], done: [false, false, false, false] },
  { title: "AP History Essay", date: "Mar 14", board: "study", status: "In Progress", color: "#2E9E8F", checklist: ["Gather sources ✓", "Create outline ✓", "Draft body paragraphs", "Proofread & submit"], done: [true, true, false, false] },
  { title: "Soccer Tournament", date: "Mar 22", board: "activity", status: "In Progress", color: "#E67E22", checklist: ["Pack gear bag ✓", "Print bracket", "Arrange carpool", "Bring snacks"], done: [true, false, false, false] },
];

function MockDashboard({ activeBoard, setActiveBoard, highlightedTarget }) {
  const board = BOARDS_CONFIG.find(b => b.id === activeBoard) || BOARDS_CONFIG[0];

  const isHighlighted = (selector) => highlightedTarget === selector;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f8f9fc", minHeight: "100vh", position: "relative" }}>
      {/* Top nav */}
      <div style={{ background: "white", borderBottom: "1px solid #e8edf5", padding: "0 16px", display: "flex", alignItems: "center", gap: 12, height: 52, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {BOARDS_CONFIG.slice(0, 2).map(b => (
            <div key={b.id} style={{ width: 22, height: 22, borderRadius: 5, background: b.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", color: "white", fontSize: 10, fontWeight: 700 }}>{b.letter}</div>
          ))}
        </div>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#1a1a2e", fontWeight: 700 }}>Clarityboards</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <div data-tour="upgrade-banner" style={{
            background: isHighlighted("[data-tour='upgrade-banner']") ? "#fff8e1" : "#EAFAF1",
            border: `1px solid ${isHighlighted("[data-tour='upgrade-banner']") ? "#f59e0b" : "#27AE60"}40`,
            borderRadius: 20, padding: "4px 12px", fontSize: 11,
            color: isHighlighted("[data-tour='upgrade-banner']") ? "#92400e" : "#27AE60",
            fontFamily: "'DM Mono', monospace", fontWeight: 700, cursor: "pointer",
            transition: "all 0.3s",
            boxShadow: isHighlighted("[data-tour='upgrade-banner']") ? "0 0 0 3px #fbbf2460" : "none",
          }}>
            ⭐ Upgrade to Pro
          </div>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1B4F8A", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 700 }}>L</div>
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Board tabs */}
        <div data-tour="board-tabs" style={{
          display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap",
          padding: isHighlighted("[data-tour='board-tabs']") ? "8px" : "0",
          borderRadius: 12,
          background: isHighlighted("[data-tour='board-tabs']") ? "rgba(27,79,138,0.06)" : "transparent",
          transition: "all 0.3s",
          boxShadow: isHighlighted("[data-tour='board-tabs']") ? "0 0 0 3px #1B4F8A40" : "none",
        }}>
          {["All Boards", ...BOARDS_CONFIG.slice(0, 2).map(b => b.label)].map((label, i) => {
            const active = i === 0 ? activeBoard === "all" : BOARDS_CONFIG[i - 1]?.id === activeBoard;
            const color = i === 0 ? "#1a1a2e" : BOARDS_CONFIG[i - 1]?.color;
            return (
              <button key={i} data-tour={i === 0 ? "unified-feed" : undefined} onClick={() => setActiveBoard(i === 0 ? "all" : BOARDS_CONFIG[i - 1].id)}
                style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: active ? color : "white", color: active ? "white" : "#666", fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif", boxShadow: active ? `0 2px 8px ${color}40` : "0 1px 3px rgba(0,0,0,0.06)",
                  outline: i === 0 && isHighlighted("[data-tour='unified-feed']") ? "3px solid #1B4F8A" : "none",
                }}>
                {i === 0 ? "🔀 All Boards" : label}
              </button>
            );
          })}
          <button data-tour="add-button" style={{
            marginLeft: "auto", width: 36, height: 36, borderRadius: 10, border: "none",
            background: board.color, color: "white", fontSize: 20, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: isHighlighted("[data-tour='add-button']") ? `0 0 0 4px ${board.color}50, 0 4px 14px ${board.color}60` : `0 2px 8px ${board.color}40`,
            transition: "all 0.3s",
            animation: isHighlighted("[data-tour='add-button']") ? "tourPulse 1s ease-in-out infinite" : "none",
          }}>+</button>
        </div>

        {/* Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MOCK_ITEMS.map((item, idx) => {
            const doneCount = item.done.filter(Boolean).length;
            const pct = Math.round((doneCount / item.checklist.length) * 100);
            return (
              <div key={idx} style={{ background: "white", borderRadius: 12, border: `1px solid ${item.color}20`, borderLeft: `3px solid ${item.color}`, padding: "14px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>{item.title}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#888", fontFamily: "'DM Mono', monospace" }}>📅 {item.date}</span>
                      <span data-tour={idx === 0 ? "status-badge" : undefined} style={{
                        background: `${item.color}15`, color: item.color,
                        border: `1px solid ${item.color}35`, borderRadius: 20,
                        padding: "2px 10px", fontSize: 11, fontWeight: 700,
                        fontFamily: "'DM Mono', monospace",
                        boxShadow: idx === 0 && isHighlighted("[data-tour='status-badge']") ? `0 0 0 3px ${item.color}50` : "none",
                        transition: "all 0.3s",
                      }}>{item.status}</span>
                    </div>
                  </div>
                </div>

                {/* Checklist preview */}
                <div data-tour={idx === 0 ? "checklist" : undefined} style={{
                  borderTop: `1px solid ${item.color}15`, paddingTop: 10, marginTop: 4,
                  padding: idx === 0 && isHighlighted("[data-tour='checklist']") ? "10px 8px 4px" : "10px 0 4px",
                  borderRadius: idx === 0 && isHighlighted("[data-tour='checklist']") ? 8 : 0,
                  background: idx === 0 && isHighlighted("[data-tour='checklist']") ? `${item.color}08` : "transparent",
                  boxShadow: idx === 0 && isHighlighted("[data-tour='checklist']") ? `0 0 0 2px ${item.color}40` : "none",
                  transition: "all 0.3s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 10, color: "#aaa", fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>CHECKLIST</span>
                    <span style={{ fontSize: 10, color: item.color, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{doneCount}/{item.checklist.length}</span>
                  </div>
                  <div style={{ height: 4, background: "#f0f0f0", borderRadius: 4, marginBottom: 8 }}>
                    <div style={{ height: 4, background: item.color, borderRadius: 4, width: `${pct}%` }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {item.checklist.map((task, ti) => (
                      <div key={ti} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: item.done[ti] ? item.color : "transparent", border: `2px solid ${item.done[ti] ? item.color : "#ddd"}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {item.done[ti] && <span style={{ color: "white", fontSize: 9 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 12, color: item.done[ti] ? "#bbb" : "#555", textDecoration: item.done[ti] ? "line-through" : "none", fontFamily: "'DM Sans', sans-serif" }}>{task.replace(" ✓", "")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TOOLTIP COMPONENT
// ─────────────────────────────────────────────
function TourTooltip({ step, stepIndex, totalSteps, onNext, onPrev, onSkip, targetRect, containerRef }) {
  const tooltipRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [arrowPos, setArrowPos] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, [stepIndex]);

  useEffect(() => {
    if (!tooltipRef.current || !containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const tip = tooltipRef.current.getBoundingClientRect();
    const TW = tip.width || 300;
    const TH = tip.height || 160;
    const PAD = 16;

    if (!targetRect || step.position === "center") {
      setPos({ top: Math.max(PAD, (container.height - TH) / 2), left: Math.max(PAD, (container.width - TW) / 2) });
      setArrowPos(null);
      return;
    }

    // Target relative to container
    const tTop = targetRect.top - container.top;
    const tLeft = targetRect.left - container.left;
    const tBottom = tTop + targetRect.height;
    const tRight = tLeft + targetRect.width;
    const tCx = tLeft + targetRect.width / 2;
    const tCy = tTop + targetRect.height / 2;

    let top, left, arrow = null;

    if (step.position === "bottom") {
      top = tBottom + 12;
      left = Math.min(Math.max(PAD, tCx - TW / 2), container.width - TW - PAD);
      arrow = { side: "top", left: tCx - left - 8 };
    } else if (step.position === "top") {
      top = tTop - TH - 12;
      left = Math.min(Math.max(PAD, tCx - TW / 2), container.width - TW - PAD);
      arrow = { side: "bottom", left: tCx - left - 8 };
    } else if (step.position === "left") {
      top = Math.min(Math.max(PAD, tCy - TH / 2), container.height - TH - PAD);
      left = tLeft - TW - 12;
      if (left < PAD) { left = tRight + 12; arrow = { side: "left", top: tCy - top - 8 }; }
      else arrow = { side: "right", top: tCy - top - 8 };
    } else {
      top = Math.min(Math.max(PAD, tCy - TH / 2), container.height - TH - PAD);
      left = tRight + 12;
      if (left + TW > container.width - PAD) { left = tLeft - TW - 12; arrow = { side: "right", top: tCy - top - 8 }; }
      else arrow = { side: "left", top: tCy - top - 8 };
    }

    // Clamp
    top = Math.max(PAD, Math.min(top, container.height - TH - PAD));
    left = Math.max(PAD, Math.min(left, container.width - TW - PAD));

    setPos({ top, left });
    setArrowPos(arrow);
  }, [step, targetRect, stepIndex]);

  const progressPct = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <div
      ref={tooltipRef}
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        width: 300,
        background: "white",
        borderRadius: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.1)",
        border: `2px solid ${step.color}25`,
        zIndex: 1000,
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1) translateY(0)" : "scale(0.95) translateY(6px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        overflow: "visible",
      }}
    >
      {/* Arrow */}
      {arrowPos && (
        <div style={{
          position: "absolute",
          width: 0, height: 0,
          ...(arrowPos.side === "top" && { top: -9, left: Math.max(12, arrowPos.left), borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderBottom: `9px solid ${step.color}25` }),
          ...(arrowPos.side === "bottom" && { bottom: -9, left: Math.max(12, arrowPos.left), borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderTop: `9px solid ${step.color}25` }),
          ...(arrowPos.side === "left" && { left: -9, top: Math.max(12, arrowPos.top), borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderRight: `9px solid ${step.color}25` }),
          ...(arrowPos.side === "right" && { right: -9, top: Math.max(12, arrowPos.top), borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderLeft: `9px solid ${step.color}25` }),
        }} />
      )}

      {/* Progress bar */}
      <div style={{ height: 3, background: "#f0f4f8", borderRadius: "16px 16px 0 0", overflow: "hidden" }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${step.color}, ${step.color}cc)`, width: `${progressPct}%`, transition: "width 0.4s ease", borderRadius: "16px 0 0 0" }} />
      </div>

      {/* Header */}
      <div style={{ padding: "16px 18px 12px", borderBottom: `1px solid ${step.color}12` }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, boxShadow: `0 3px 10px ${step.color}40` }}>
            {step.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: step.color, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3 }}>
              Step {stepIndex + 1} of {totalSteps}
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#1a1a2e", lineHeight: 1.3 }}>{step.title}</div>
          </div>
          <button onClick={onSkip} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 16, padding: "0 0 0 4px", lineHeight: 1, flexShrink: 0 }} title="Skip tour">✕</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 18px" }}>
        <p style={{ fontSize: 13, color: "#555", lineHeight: 1.65, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{step.body}</p>
      </div>

      {/* Step dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 5, paddingBottom: 4 }}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} style={{ width: i === stepIndex ? 18 : 6, height: 6, borderRadius: 3, background: i === stepIndex ? step.color : i < stepIndex ? `${step.color}60` : "#e0e7ef", transition: "all 0.3s" }} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 18px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <button
          onClick={onPrev}
          disabled={stepIndex === 0}
          style={{ background: "none", border: "1px solid #e0e7ef", borderRadius: 8, padding: "7px 14px", fontSize: 12, color: stepIndex === 0 ? "#ccc" : "#666", cursor: stepIndex === 0 ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}
        >← Back</button>

        <button
          onClick={onNext}
          style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}dd)`, border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, color: "white", cursor: "pointer", fontWeight: 700, fontFamily: "'DM Sans', sans-serif", boxShadow: `0 3px 12px ${step.color}50`, transition: "all 0.2s", flex: stepIndex === TOUR_STEPS.length - 1 ? 1 : undefined }}
        >{step.cta}</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SPOTLIGHT OVERLAY
// Cuts a transparent rectangle over the target element
// ─────────────────────────────────────────────
function SpotlightOverlay({ targetRect, containerRect, color }) {
  if (!targetRect || !containerRect) {
    return <div style={{ position: "absolute", inset: 0, background: "rgba(15,20,40,0.55)", zIndex: 500, borderRadius: 0 }} />;
  }

  const PAD = 8;
  const relTop = targetRect.top - containerRect.top - PAD;
  const relLeft = targetRect.left - containerRect.left - PAD;
  const w = targetRect.width + PAD * 2;
  const h = targetRect.height + PAD * 2;
  const W = containerRect.width;
  const H = containerRect.height;

  return (
    <svg
      style={{ position: "absolute", inset: 0, zIndex: 500, pointerEvents: "none", width: "100%", height: "100%" }}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
    >
      <defs>
        <mask id="spotlight-mask">
          <rect width={W} height={H} fill="white" />
          <rect x={relLeft} y={relTop} width={w} height={h} rx={10} ry={10} fill="black" />
        </mask>
      </defs>
      <rect width={W} height={H} fill="rgba(15,20,40,0.58)" mask="url(#spotlight-mask)" />
      <rect x={relLeft} y={relTop} width={w} height={h} rx={10} ry={10} fill="none" stroke={color} strokeWidth="2.5" opacity="0.7" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// MAIN TOUR ORCHESTRATOR
// ─────────────────────────────────────────────
function OnboardingTour({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [containerRect, setContainerRect] = useState(null);
  const containerRef = useRef(null);
  const [activeBoard, setActiveBoard] = useState("event");

  const step = TOUR_STEPS[stepIndex];

  // Measure target element
  const measureTarget = useCallback(() => {
    if (!containerRef.current) return;
    setContainerRect(containerRef.current.getBoundingClientRect());

    if (!step.target) {
      setTargetRect(null);
      return;
    }
    const el = containerRef.current.querySelector(step.target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    // Small delay to allow re-render of highlighted elements
    const t = setTimeout(measureTarget, 120);
    window.addEventListener("resize", measureTarget);
    return () => { clearTimeout(t); window.removeEventListener("resize", measureTarget); };
  }, [measureTarget]);

  const handleNext = () => {
    if (stepIndex === TOUR_STEPS.length - 1) { onComplete?.(); return; }
    setStepIndex(i => i + 1);
  };

  const handlePrev = () => setStepIndex(i => Math.max(0, i - 1));
  const handleSkip = () => onComplete?.();

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; }
        @keyframes tourPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(27,79,138,0.5), 0 4px 14px rgba(27,79,138,0.6); }
          50% { box-shadow: 0 0 0 8px rgba(27,79,138,0.25), 0 4px 14px rgba(27,79,138,0.6); }
        }
      `}</style>

      {/* Scrollable mock dashboard behind overlay */}
      <div style={{ position: "absolute", inset: 0, overflowY: "auto" }}>
        <MockDashboard
          activeBoard={activeBoard}
          setActiveBoard={setActiveBoard}
          highlightedTarget={step.target}
        />
      </div>

      {/* Spotlight overlay */}
      <div style={{ position: "absolute", inset: 0, zIndex: 500, pointerEvents: "none" }}>
        <SpotlightOverlay
          targetRect={targetRect}
          containerRect={containerRect}
          color={step.color}
        />
      </div>

      {/* Overlay click-block (except on target) */}
      <div style={{ position: "absolute", inset: 0, zIndex: 600, pointerEvents: "none" }} />

      {/* Tooltip */}
      <div style={{ position: "absolute", inset: 0, zIndex: 700, pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <TourTooltip
            step={step}
            stepIndex={stepIndex}
            totalSteps={TOUR_STEPS.length}
            onNext={handleNext}
            onPrev={handlePrev}
            onSkip={handleSkip}
            targetRect={targetRect}
            containerRef={containerRef}
          />
        </div>
      </div>

      {/* Make tooltip interactive */}
      <style>{`
        div[style*="z-index: 700"] > div > div {
          pointer-events: auto !important;
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// DEMO WRAPPER — shows tour then completion screen
// ─────────────────────────────────────────────
export default function App() {
  const [tourDone, setTourDone] = useState(false);
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "linear-gradient(135deg, #1a1a2e 0%, #1B4F8A 60%, #2E9E8F 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <style>{"@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');"}</style>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
            {["E","S","A","C","T"].map((l, i) => (
              <div key={i} style={{ width: 38, height: 38, borderRadius: 10, background: ["#1B4F8A","#2E9E8F","#E67E22","#8E44AD","#27AE60"][i], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", color: "white", fontWeight: 700, fontSize: 16, boxShadow: `0 3px 12px rgba(0,0,0,0.3)` }}>{l}</div>
            ))}
          </div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: "white", marginBottom: 10 }}>
            Welcome to<br /><span style={{ fontStyle: "italic", color: "#7ecfea" }}>Clarityboards</span>
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 32, lineHeight: 1.6 }}>
            One platform for every part of your busy life. Let's take a quick tour — it only takes 60 seconds.
          </div>
          <button
            onClick={() => setStarted(true)}
            style={{ background: "white", color: "#1B4F8A", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", marginBottom: 12, display: "block", width: "100%" }}
          >
            Start the tour →
          </button>
          <button
            onClick={() => { setStarted(true); setTourDone(true); }}
            style={{ background: "none", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.6)", borderRadius: 12, padding: "10px 24px", fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", width: "100%" }}
          >
            Skip tour, take me to the dashboard
          </button>
        </div>
      </div>
    );
  }

  if (tourDone) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f8f9fc", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <style>{"@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');"}</style>
        <div style={{ textAlign: "center", maxWidth: 340 }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#1a1a2e", marginBottom: 10 }}>You're all set!</div>
          <div style={{ fontSize: 14, color: "#666", marginBottom: 28, lineHeight: 1.6 }}>Tour complete. Head to your dashboard and add your first item — it takes about 10 seconds.</div>
          <button
            onClick={() => { setTourDone(false); setStarted(false); }}
            style={{ background: "#1B4F8A", color: "white", border: "none", borderRadius: 12, padding: "13px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 16px rgba(27,79,138,0.35)", marginBottom: 12, display: "block", width: "100%" }}
          >Go to Dashboard →</button>
          <button
            onClick={() => { setTourDone(false); setStarted(true); }}
            style={{ background: "none", border: "1px solid #e0e7ef", color: "#888", borderRadius: 12, padding: "10px 20px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", width: "100%" }}
          >↩ Replay tour</button>
        </div>
      </div>
    );
  }

  return <OnboardingTour onComplete={() => setTourDone(true)} />;
}

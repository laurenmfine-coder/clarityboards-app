'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'

const BOARDS_CONFIG = [
  { id: 'event',    label: 'EventBoard',    letter: 'E', color: '#1B4F8A', emoji: '🎉' },
  { id: 'study',    label: 'StudyBoard',    letter: 'S', color: '#2E9E8F', emoji: '📚' },
  { id: 'activity', label: 'ActivityBoard', letter: 'A', color: '#E67E22', emoji: '⚽' },
  { id: 'career',   label: 'CareerBoard',   letter: 'C', color: '#8E44AD', emoji: '💼' },
  { id: 'task',     label: 'TaskBoard',     letter: 'T', color: '#27AE60', emoji: '✅' },
]

const MOCK_ITEMS = [
  { title: "Emma's Bat Mitzvah",  date: 'Mar 28', board: 'event',    status: 'RSVP Needed', color: '#1B4F8A', checklist: ['RSVP by deadline','Order gift','Babysitter','Outfit'],             done: [false,false,false,false] },
  { title: 'AP History Essay',    date: 'Mar 14', board: 'study',    status: 'In Progress',  color: '#2E9E8F', checklist: ['Gather sources ✓','Create outline ✓','Draft body paragraphs','Proofread & submit'], done: [true,true,false,false] },
  { title: 'Soccer Tournament',   date: 'Mar 22', board: 'activity', status: 'In Progress',  color: '#E67E22', checklist: ['Pack gear bag ✓','Print bracket','Arrange carpool','Bring snacks'], done: [true,false,false,false] },
]

// ── Mock dashboard ────────────────────────────────────────
function MockDashboard({ activeBoard, setActiveBoard, highlightedTarget, t }: any) {
  const board = BOARDS_CONFIG.find(b => b.id === activeBoard) || BOARDS_CONFIG[0]
  const hl = (s: string) => highlightedTarget === s

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f8f9fc', minHeight: '100vh', position: 'relative' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #e8edf5', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, height: 52, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {BOARDS_CONFIG.slice(0, 2).map(b => (
            <div key={b.id} style={{ width: 22, height: 22, borderRadius: 5, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700 }}>{b.letter}</div>
          ))}
        </div>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: '#1a1a2e', fontWeight: 700 }}>Clarityboards</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div data-tour="upgrade-banner" style={{ background: hl("[data-tour='upgrade-banner']") ? '#fff8e1' : '#EAFAF1', border: `1px solid ${hl("[data-tour='upgrade-banner']") ? '#f59e0b' : '#27AE60'}40`, borderRadius: 20, padding: '4px 12px', fontSize: 11, color: hl("[data-tour='upgrade-banner']") ? '#92400e' : '#27AE60', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', boxShadow: hl("[data-tour='upgrade-banner']") ? '0 0 0 3px #fbbf2460' : 'none' }}>
            {t('upgradeBadge')}
          </div>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1B4F8A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700 }}>L</div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div data-tour="board-tabs" style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', padding: hl("[data-tour='board-tabs']") ? '8px' : '0', borderRadius: 12, background: hl("[data-tour='board-tabs']") ? 'rgba(27,79,138,0.06)' : 'transparent', transition: 'all 0.3s', boxShadow: hl("[data-tour='board-tabs']") ? '0 0 0 3px #1B4F8A40' : 'none' }}>
          {[{ id: 'all', label: t('allBoards') }, ...BOARDS_CONFIG.slice(0, 2)].map((item, i) => {
            const active = i === 0 ? activeBoard === 'all' : BOARDS_CONFIG[i - 1]?.id === activeBoard
            const color  = i === 0 ? '#1a1a2e' : BOARDS_CONFIG[i - 1]?.color
            return (
              <button key={i} data-tour={i === 0 ? 'unified-feed' : undefined}
                onClick={() => setActiveBoard(i === 0 ? 'all' : BOARDS_CONFIG[i - 1].id)}
                style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: active ? color : 'white', color: active ? 'white' : '#666', fontWeight: active ? 700 : 500, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', boxShadow: active ? `0 2px 8px ${color}40` : '0 1px 3px rgba(0,0,0,0.06)', outline: i === 0 && hl("[data-tour='unified-feed']") ? '3px solid #1B4F8A' : 'none' }}>
                {item.label}
              </button>
            )
          })}
          <button data-tour="add-button" style={{ marginLeft: 'auto', width: 36, height: 36, borderRadius: 10, border: 'none', background: board.color, color: 'white', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: hl("[data-tour='add-button']") ? `0 0 0 4px ${board.color}50, 0 4px 14px ${board.color}60` : `0 2px 8px ${board.color}40`, transition: 'all 0.3s', animation: hl("[data-tour='add-button']") ? 'tourPulse 1s ease-in-out infinite' : 'none' }}>+</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MOCK_ITEMS.map((item, idx) => {
            const doneCount = item.done.filter(Boolean).length
            const pct = Math.round((doneCount / item.checklist.length) * 100)
            return (
              <div key={idx} style={{ background: 'white', borderRadius: 12, border: `1px solid ${item.color}20`, borderLeft: `3px solid ${item.color}`, padding: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 4 }}>{item.title}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#888' }}>📅 {item.date}</span>
                      <span data-tour={idx === 0 ? 'status-badge' : undefined} style={{ background: `${item.color}15`, color: item.color, border: `1px solid ${item.color}35`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, boxShadow: idx === 0 && hl("[data-tour='status-badge']") ? `0 0 0 3px ${item.color}50` : 'none', transition: 'all 0.3s' }}>{item.status}</span>
                    </div>
                  </div>
                </div>
                <div data-tour={idx === 0 ? 'checklist' : undefined} style={{ borderTop: `1px solid ${item.color}15`, paddingTop: 10, marginTop: 4, padding: idx === 0 && hl("[data-tour='checklist']") ? '10px 8px 4px' : '10px 0 4px', borderRadius: idx === 0 && hl("[data-tour='checklist']") ? 8 : 0, background: idx === 0 && hl("[data-tour='checklist']") ? `${item.color}08` : 'transparent', boxShadow: idx === 0 && hl("[data-tour='checklist']") ? `0 0 0 2px ${item.color}40` : 'none', transition: 'all 0.3s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 10, color: '#aaa', fontWeight: 600 }}>CHECKLIST</span>
                    <span style={{ fontSize: 10, color: item.color, fontWeight: 700 }}>{doneCount}/{item.checklist.length}</span>
                  </div>
                  <div style={{ height: 4, background: '#f0f0f0', borderRadius: 4, marginBottom: 8 }}>
                    <div style={{ height: 4, background: item.color, borderRadius: 4, width: `${pct}%` }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {item.checklist.map((task, ti) => (
                      <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: item.done[ti] ? item.color : 'transparent', border: `2px solid ${item.done[ti] ? item.color : '#ddd'}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.done[ti] && <span style={{ color: 'white', fontSize: 9 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 12, color: item.done[ti] ? '#bbb' : '#555', textDecoration: item.done[ti] ? 'line-through' : 'none' }}>{task.replace(' ✓', '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Tooltip ───────────────────────────────────────────────
function TourTooltip({ step, stepIndex, totalSteps, onNext, onPrev, onSkip, targetRect, containerRef, t }: any) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [arrowPos, setArrowPos] = useState<any>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)
    const timer = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(timer)
  }, [stepIndex])

  useEffect(() => {
    if (!tooltipRef.current || !containerRef.current) return
    const container = containerRef.current.getBoundingClientRect()
    const tip = tooltipRef.current.getBoundingClientRect()
    const TW = tip.width || 300, TH = tip.height || 160, PAD = 16

    if (!targetRect || step.position === 'center') {
      setPos({ top: Math.max(PAD, (container.height - TH) / 2), left: Math.max(PAD, (container.width - TW) / 2) })
      setArrowPos(null); return
    }

    const tTop = targetRect.top - container.top, tLeft = targetRect.left - container.left
    const tBottom = tTop + targetRect.height, tRight = tLeft + targetRect.width
    const tCx = tLeft + targetRect.width / 2, tCy = tTop + targetRect.height / 2
    let top: number, left: number, arrow: any = null

    if (step.position === 'bottom') {
      top = tBottom + 12; left = Math.min(Math.max(PAD, tCx - TW / 2), container.width - TW - PAD); arrow = { side: 'top', left: tCx - left - 8 }
    } else if (step.position === 'top') {
      top = tTop - TH - 12; left = Math.min(Math.max(PAD, tCx - TW / 2), container.width - TW - PAD); arrow = { side: 'bottom', left: tCx - left - 8 }
    } else if (step.position === 'left') {
      top = Math.min(Math.max(PAD, tCy - TH / 2), container.height - TH - PAD); left = tLeft - TW - 12
      if (left < PAD) { left = tRight + 12; arrow = { side: 'left', top: tCy - top - 8 } } else arrow = { side: 'right', top: tCy - top - 8 }
    } else {
      top = Math.min(Math.max(PAD, tCy - TH / 2), container.height - TH - PAD); left = tRight + 12
      if (left + TW > container.width - PAD) { left = tLeft - TW - 12; arrow = { side: 'right', top: tCy - top - 8 } } else arrow = { side: 'left', top: tCy - top - 8 }
    }

    top = Math.max(PAD, Math.min(top, container.height - TH - PAD))
    left = Math.max(PAD, Math.min(left, container.width - TW - PAD))
    setPos({ top, left }); setArrowPos(arrow)
  }, [step, targetRect, stepIndex])

  const progressPct = ((stepIndex + 1) / totalSteps) * 100

  return (
    <div ref={tooltipRef} style={{ position: 'absolute', top: pos.top, left: pos.left, width: 300, background: 'white', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.1)', border: `2px solid ${step.color}25`, zIndex: 1000, opacity: visible ? 1 : 0, transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(6px)', transition: 'opacity 0.25s ease, transform 0.25s ease', overflow: 'visible' }}>
      {arrowPos && (
        <div style={{ position: 'absolute', width: 0, height: 0,
          ...(arrowPos.side === 'top'    && { top: -9,    left: Math.max(12, arrowPos.left), borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: `9px solid ${step.color}25` }),
          ...(arrowPos.side === 'bottom' && { bottom: -9, left: Math.max(12, arrowPos.left), borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: `9px solid ${step.color}25` }),
          ...(arrowPos.side === 'left'   && { left: -9,   top: Math.max(12, arrowPos.top),  borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderRight: `9px solid ${step.color}25` }),
          ...(arrowPos.side === 'right'  && { right: -9,  top: Math.max(12, arrowPos.top),  borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderLeft: `9px solid ${step.color}25` }),
        }} />
      )}
      <div style={{ height: 3, background: '#f0f4f8', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${step.color}, ${step.color}cc)`, width: `${progressPct}%`, transition: 'width 0.4s ease', borderRadius: '16px 0 0 0' }} />
      </div>
      <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${step.color}12` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, boxShadow: `0 3px 10px ${step.color}40` }}>{step.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: step.color, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 }}>
              {t('stepOf', { current: stepIndex + 1, total: totalSteps })}
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: '#1a1a2e', lineHeight: 1.3 }}>{step.title}</div>
          </div>
          <button onClick={onSkip} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 16, padding: '0 0 0 4px', lineHeight: 1, flexShrink: 0 }} title={t('skip')}>✕</button>
        </div>
      </div>
      <div style={{ padding: '14px 18px' }}>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, margin: 0 }}>{step.body}</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, paddingBottom: 4 }}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} style={{ width: i === stepIndex ? 18 : 6, height: 6, borderRadius: 3, background: i === stepIndex ? step.color : i < stepIndex ? `${step.color}60` : '#e0e7ef', transition: 'all 0.3s' }} />
        ))}
      </div>
      <div style={{ padding: '12px 18px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <button onClick={onPrev} disabled={stepIndex === 0} style={{ background: 'none', border: '1px solid #e0e7ef', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: stepIndex === 0 ? '#ccc' : '#666', cursor: stepIndex === 0 ? 'default' : 'pointer', transition: 'all 0.2s' }}>
          {t('back')}
        </button>
        <button onClick={onNext} style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}dd)`, border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, color: 'white', cursor: 'pointer', fontWeight: 700, boxShadow: `0 3px 12px ${step.color}50`, transition: 'all 0.2s' }}>
          {step.cta}
        </button>
      </div>
    </div>
  )
}

// ── Spotlight overlay ─────────────────────────────────────
function SpotlightOverlay({ targetRect, containerRect, color }: any) {
  if (!targetRect || !containerRect) return <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,20,40,0.55)', zIndex: 500 }} />
  const PAD = 8
  const relTop = targetRect.top - containerRect.top - PAD
  const relLeft = targetRect.left - containerRect.left - PAD
  const w = targetRect.width + PAD * 2, h = targetRect.height + PAD * 2
  const W = containerRect.width, H = containerRect.height
  return (
    <svg style={{ position: 'absolute', inset: 0, zIndex: 500, pointerEvents: 'none', width: '100%', height: '100%' }} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <mask id="spotlight-mask">
          <rect width={W} height={H} fill="white" />
          <rect x={relLeft} y={relTop} width={w} height={h} rx={10} ry={10} fill="black" />
        </mask>
      </defs>
      <rect width={W} height={H} fill="rgba(15,20,40,0.58)" mask="url(#spotlight-mask)" />
      <rect x={relLeft} y={relTop} width={w} height={h} rx={10} ry={10} fill="none" stroke={color} strokeWidth="2.5" opacity="0.7" />
    </svg>
  )
}

// ── Main tour ─────────────────────────────────────────────
function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const t = useTranslations('tour')
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeBoard, setActiveBoard] = useState('event')

  const TOUR_STEPS = [
    { id: 'welcome',  target: null,                          position: 'center', title: t('welcome.title'),  body: t('welcome.body'),  cta: t('welcome.cta'),  icon: '✦', color: '#1B4F8A' },
    { id: 'boards',   target: "[data-tour='board-tabs']",    position: 'bottom', title: t('boards.title'),   body: t('boards.body'),   cta: t('boards.cta'),   icon: '🗂️', color: '#1B4F8A' },
    { id: 'add-item', target: "[data-tour='add-button']",    position: 'left',   title: t('addItem.title'),  body: t('addItem.body'),  cta: t('addItem.cta'),  icon: '➕', color: '#2E9E8F' },
    { id: 'checklist',target: "[data-tour='checklist']",     position: 'top',    title: t('checklist.title'),body: t('checklist.body'),cta: t('checklist.cta'),icon: '☑️', color: '#E67E22' },
    { id: 'status',   target: "[data-tour='status-badge']",  position: 'bottom', title: t('status.title'),   body: t('status.body'),   cta: t('status.cta'),   icon: '🏷️', color: '#8E44AD' },
    { id: 'unified',  target: "[data-tour='unified-feed']",  position: 'top',    title: t('unified.title'),  body: t('unified.body'),  cta: t('unified.cta'),  icon: '🔀', color: '#1B4F8A' },
    { id: 'upgrade',  target: "[data-tour='upgrade-banner']",position: 'top',    title: t('upgrade.title'),  body: t('upgrade.body'),  cta: t('upgrade.cta'),  icon: '⭐', color: '#27AE60' },
    { id: 'done',     target: null,                          position: 'center', title: t('done.title'),     body: t('done.body'),     cta: t('done.cta'),     icon: '🎉', color: '#1B4F8A' },
  ]

  const step = TOUR_STEPS[stepIndex]

  const measureTarget = useCallback(() => {
    if (!containerRef.current) return
    setContainerRect(containerRef.current.getBoundingClientRect())
    if (!step.target) { setTargetRect(null); return }
    const el = containerRef.current.querySelector(step.target)
    if (el) setTargetRect(el.getBoundingClientRect())
    else setTargetRect(null)
  }, [step])

  useEffect(() => {
    const timer = setTimeout(measureTarget, 120)
    window.addEventListener('resize', measureTarget)
    return () => { clearTimeout(timer); window.removeEventListener('resize', measureTarget) }
  }, [measureTarget])

  const handleNext = () => { if (stepIndex === TOUR_STEPS.length - 1) { onComplete?.(); return } setStepIndex(i => i + 1) }
  const handlePrev = () => setStepIndex(i => Math.max(0, i - 1))
  const handleSkip = () => onComplete?.()

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; }
        @keyframes tourPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(27,79,138,0.5), 0 4px 14px rgba(27,79,138,0.6); }
          50%       { box-shadow: 0 0 0 8px rgba(27,79,138,0.25), 0 4px 14px rgba(27,79,138,0.6); }
        }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
        <MockDashboard activeBoard={activeBoard} setActiveBoard={setActiveBoard} highlightedTarget={step.target} t={t} />
      </div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 500, pointerEvents: 'none' }}>
        <SpotlightOverlay targetRect={targetRect} containerRect={containerRect} color={step.color} />
      </div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 700, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <TourTooltip step={step} stepIndex={stepIndex} totalSteps={TOUR_STEPS.length} onNext={handleNext} onPrev={handlePrev} onSkip={handleSkip} targetRect={targetRect} containerRef={containerRef} t={t} />
        </div>
      </div>
      <style>{`div[style*="z-index: 700"] > div > div { pointer-events: auto !important; }`}</style>
    </div>
  )
}

// ── Export wrapper ────────────────────────────────────────
export default function App({ onComplete }: { onComplete: () => void }) {
  const t = useTranslations('tour')
  const [tourDone, setTourDone] = useState(false)
  const [started, setStarted]   = useState(false)

  if (!started) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #1B4F8A 60%, #2E9E8F 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');`}</style>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
            {['E','S','A','C','T'].map((l, i) => (
              <div key={i} style={{ width: 38, height: 38, borderRadius: 10, background: ['#1B4F8A','#2E9E8F','#E67E22','#8E44AD','#27AE60'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16, boxShadow: '0 3px 12px rgba(0,0,0,0.3)' }}>{l}</div>
            ))}
          </div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: 'white', marginBottom: 10 }}>
            {t('welcomeTitle')}<br /><span style={{ fontStyle: 'italic', color: '#7ecfea' }}>{t('welcomeApp')}</span>
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 32, lineHeight: 1.6 }}>{t('welcomeBody')}</div>
          <button onClick={() => setStarted(true)} style={{ background: 'white', color: '#1B4F8A', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', marginBottom: 12, display: 'block', width: '100%' }}>
            {t('startTour')}
          </button>
          <button onClick={() => onComplete()} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: '10px 24px', fontSize: 14, cursor: 'pointer', width: '100%' }}>
            {t('skipTour')}
          </button>
        </div>
      </div>
    )
  }

  if (tourDone) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 340 }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: '#1a1a2e', marginBottom: 10 }}>{t('tourComplete')}</div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 28, lineHeight: 1.6 }}>{t('tourCompleteBody')}</div>
          <button onClick={() => onComplete()} style={{ background: '#1B4F8A', color: 'white', border: 'none', borderRadius: 12, padding: '13px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(27,79,138,0.35)', marginBottom: 12, display: 'block', width: '100%' }}>
            {t('goToDashboard')}
          </button>
          <button onClick={() => { setTourDone(false); setStarted(true) }} style={{ background: 'none', border: '1px solid #e0e7ef', color: '#888', borderRadius: 12, padding: '10px 20px', fontSize: 13, cursor: 'pointer', width: '100%' }}>
            {t('replayTour')}
          </button>
        </div>
      </div>
    )
  }

  return <OnboardingTour onComplete={() => setTourDone(true)} />
}

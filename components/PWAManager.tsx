"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAManager() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("SW registration failed:", err));
    }
    const isPWA = window.matchMedia("(display-mode: standalone)").matches;
    const wasDismissed = localStorage.getItem("cb_pwa_dismissed");
    if (isPWA || wasDismissed) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);
    if (ios) {
      setTimeout(() => setShowBanner(true), 8000);
    } else {
      const handler = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e as BeforeInstallPromptEvent);
        setTimeout(() => setShowBanner(true), 4000);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setInstallPrompt(null);
    }
  };

  const dismiss = () => {
    setShowBanner(false);
    setShowIOSSheet(false);
    setDismissed(true);
    localStorage.setItem("cb_pwa_dismissed", "1");
  };

  if (!showBanner || dismissed) return null;

  const accent = "#8B6B52";
  const ink = "#1A1714";
  const sand = "#EDE8E2";
  const sub = "#6B6059";
  const serif = "'Cormorant Garamond', Georgia, serif";
  const sans = "'DM Sans', system-ui, sans-serif";

  return (
    <div>
      <style>{`@keyframes cbUp{from{transform:translateX(-50%) translateY(16px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}`}</style>

      <div style={{
        position: "fixed",
        bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9998,
        width: "calc(100% - 32px)",
        maxWidth: 400,
        background: ink,
        borderRadius: 12,
        padding: "13px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        border: "0.5px solid rgba(255,255,255,0.08)",
        animation: "cbUp 0.28s cubic-bezier(0.32,0.72,0,1)",
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(139,107,82,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5">
            <rect x="5" y="2" width="14" height="20" rx="2"/>
            <path d="M12 18h.01"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 1, fontFamily: sans }}>
            Add to your home screen
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: sans, lineHeight: 1.4 }}>
            {isIOS ? "Tap Share then Add to Home Screen" : "Open like a native app, no browser bar"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={dismiss} style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: sans }}>
            Later
          </button>
          <button onClick={isIOS ? () => setShowIOSSheet(true) : install} style={{ background: accent, border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "white", cursor: "pointer", fontFamily: sans }}>
            {isIOS ? "How?" : "Add"}
          </button>
        </div>
      </div>

      {showIOSSheet && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowIOSSheet(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(26,23,20,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#F7F4F0", borderRadius: "16px 16px 0 0", padding: "24px 24px 48px", width: "100%", maxWidth: 480 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: serif, fontSize: 20, color: ink, fontWeight: 500 }}>Add to Home Screen</div>
              <button onClick={() => setShowIOSSheet(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: sub, padding: 0, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: sand, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5"><path d="M12 17V5M12 5l-4 4M12 5l4 4"/><path d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: ink, marginBottom: 3, fontFamily: sans }}>Tap the Share button in Safari</div>
                <div style={{ fontSize: 12, color: sub, lineHeight: 1.5, fontFamily: sans }}>The box with an upward arrow at the bottom of your screen.</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: sand, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: ink, marginBottom: 3, fontFamily: sans }}>Tap "Add to Home Screen"</div>
                <div style={{ fontSize: 12, color: sub, lineHeight: 1.5, fontFamily: sans }}>Scroll down in the share sheet to find this option.</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: sand, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5"><path d="M5 13l4 4L19 7"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: ink, marginBottom: 3, fontFamily: sans }}>Tap "Add" in the top right</div>
                <div style={{ fontSize: 12, color: sub, lineHeight: 1.5, fontFamily: sans }}>Clarityboards appears on your home screen like any other app.</div>
              </div>
            </div>

            <div style={{ background: sand, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: sub, lineHeight: 1.6, fontFamily: sans }}>
                <strong style={{ color: ink }}>Must use Safari.</strong> Chrome and other browsers on iPhone do not support Add to Home Screen for web apps.
              </div>
            </div>

            <button onClick={dismiss} style={{ width: "100%", padding: "13px", background: ink, color: "white", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: sans }}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

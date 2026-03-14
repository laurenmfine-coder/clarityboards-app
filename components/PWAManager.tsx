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

    // Detect iOS — needs manual Add to Home Screen flow
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      // Show iOS banner after 8 seconds (they need more context)
      setTimeout(() => setShowBanner(true), 8000);
    } else {
      // Android/desktop: capture beforeinstallprompt
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

  return (
    <div style={{ position: "relative", zIndex: 9997 }}>
      {/* Warm banner */
      <div style={{
        position: "fixed",
        bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9998,
        width: "calc(100% - 32px)",
        maxWidth: 400,
        background: "#1A1714",
        borderRadius: 12,
        padding: "13px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        border: "0.5px solid rgba(255,255,255,0.08)",
        animation: "cbSlideUp 0.28s cubic-bezier(0.32,0.72,0,1)",
      }}>
        <style>{`@keyframes cbSlideUp{from{transform:translateX(-50%) translateY(16px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}`}</style>

        {/* Icon */}
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(139,107,82,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B6B52" strokeWidth="1.5">
            <rect x="5" y="2" width="14" height="20" rx="2"/>
            <path d="M12 18h.01"/>
          </svg>
        </div>

        {/* Copy */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 1, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Add to your home screen
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.4 }}>
            {isIOS ? "Tap Share → Add to Home Screen" : "Open like a native app, no browser bar"}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={dismiss} style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Later
          </button>
          <button
            onClick={isIOS ? () => setShowIOSSheet(true) : install}
            style={{ background: "#8B6B52", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "white", cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            {isIOS ? "How?" : "Add"}
          </button>
        </div>
      </div>

      {/* iOS instructions sheet */}
      {showIOSSheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(26,23,20,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setShowIOSSheet(false) }}>
          <div style={{ background: "#F7F4F0", borderRadius: "16px 16px 0 0", padding: "24px 24px 40px", width: "100%", maxWidth: 480, animation: "cbSlideUp 0.28s cubic-bezier(0.32,0.72,0,1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, color: "#1A1714", fontWeight: 500 }}>Add to Home Screen</div>
              <button onClick={() => setShowIOSSheet(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6B6059", padding: 0, lineHeight: 1 }}>×</button>
            </div>

            {/* Steps */}
            {[
              {
                num: "1",
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6B52" strokeWidth="1.5"><path d="M8 12h8M12 8v8"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
                title: "Tap the Share button",
                desc: "It's the box with an arrow at the bottom of your Safari browser bar",
              },
              {
                num: "2",
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6B52" strokeWidth="1.5"><path d="M12 5v14M5 12l7-7 7 7"/></svg>,
                title: "Scroll down and tap "Add to Home Screen"",
                desc: "You may need to scroll the share sheet to find this option",
              },
              {
                num: "3",
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6B52" strokeWidth="1.5"><path d="M5 13l4 4L19 7"/></svg>,
                title: "Tap "Add" in the top right",
                desc: "Clarityboards will appear on your home screen like any other app",
              },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: 20, alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EDE8E2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {step.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1714", marginBottom: 2, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: "#6B6059", lineHeight: 1.5, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{step.desc}</div>
                </div>
              </div>
            ))}

            <div style={{ background: "#EDE8E2", borderRadius: 10, padding: "12px 14px", marginTop: 4 }}>
              <div style={{ fontSize: 12, color: "#6B6059", lineHeight: 1.6, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                <strong style={{ color: "#1A1714" }}>Must use Safari.</strong> Chrome and other browsers on iPhone don't support Add to Home Screen for web apps.
              </div>
            </div>

            <button onClick={dismiss} style={{ marginTop: 16, width: "100%", padding: "12px", background: "#1A1714", color: "white", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

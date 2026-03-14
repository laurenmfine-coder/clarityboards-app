"use client";

/**
 * Clarityboards — PWA Manager
 * File: components/PWAManager.tsx
 *
 * Registers the service worker and shows an "Add to Home Screen" banner
 * when the browser fires the beforeinstallprompt event.
 */

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAManager() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("SW registration failed:", err));
    }

    // Check if already installed or previously dismissed
    const isPWA = window.matchMedia("(display-mode: standalone)").matches;
    const wasDismissed = localStorage.getItem("cb_pwa_dismissed");
    if (isPWA || wasDismissed) return;

    // Capture the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Show banner after a short delay so it doesn't pop up immediately on load
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
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
    setDismissed(true);
    localStorage.setItem("cb_pwa_dismissed", "1");
  };

  if (!showBanner || dismissed) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(64px + env(safe-area-inset-bottom, 0px))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "calc(100% - 32px)",
        maxWidth: 400,
        background: "#1A1714",
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        animation: "slideUp 0.28s cubic-bezier(0.32,0.72,0,1)",
      }}
    >
      <style>{`@keyframes slideUp { from { transform: translateX(-50%) translateY(16px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }`}</style>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(139,107,82,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B6B52" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 2, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Add to your home screen</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.4, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Open Clarityboards like an app, no browser bar</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={dismiss}
          style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Later
        </button>
        <button onClick={install}
          style={{ background: "#8B6B52", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "white", cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: "0.01em" }}>
          Add
        </button>
      </div>
    </div>
  );
}

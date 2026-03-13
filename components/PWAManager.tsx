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
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "calc(100% - 32px)",
        maxWidth: 420,
        background: "#1A2B3C",
        borderRadius: 16,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        animation: "slideUp 0.3s ease",
      }}
    >
      <style>{`@keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }`}</style>
      <div style={{ fontSize: 28, flexShrink: 0 }}>📱</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 2 }}>Add to Home Screen</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>Open Clarityboards like an app — no browser bar</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={dismiss}
          style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "7px 11px", fontSize: 12, color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit" }}
        >
          Later
        </button>
        <button
          onClick={install}
          style={{ background: "#2874A6", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer", fontFamily: "inherit" }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

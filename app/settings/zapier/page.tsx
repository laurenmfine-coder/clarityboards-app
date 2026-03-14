"use client";

/**
 * Clarityboards — Zapier Settings Page
 * File: app/settings/zapier/page.tsx
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ZapierSettingsPage() {
  const router = useRouter();
  const [keyInfo, setKeyInfo] = useState<{ exists: boolean; prefix?: string; last_used?: string; created_at?: string } | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/zapier/keys")
      .then(r => r.json())
      .then(d => { setKeyInfo(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const generate = async () => {
    setGenerating(true);
    const res = await fetch("/api/zapier/keys", { method: "POST" });
    const data = await res.json();
    if (data.api_key) {
      setNewKey(data.api_key);
      setKeyInfo({ exists: true, prefix: data.prefix, created_at: new Date().toISOString() });
    }
    setGenerating(false);
  };

  const revoke = async () => {
    if (!confirm("Revoke your API key? Any active Zaps will stop working until you reconnect with a new key.")) return;
    setRevoking(true);
    await fetch("/api/zapier/keys", { method: "DELETE" });
    setKeyInfo({ exists: false });
    setNewKey(null);
    setRevoking(false);
  };

  const copy = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#FAFAF8" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* Nav */}
            <nav style={{ background: '#1A1714', borderBottom: '0.5px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 300, padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 12L6 8l4-4"/></svg>
            Dashboard
          </button>
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)' }}/>
          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'white', fontSize: 19, fontWeight: 400, letterSpacing: '0.01em' }}>
            Zapier Integration
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px 60px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, background: "linear-gradient(135deg, #FF4A00, #FF6D3B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 4px 16px rgba(255,74,0,0.3)" }}>⚡</div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, color: "#1A1714" }}>Zapier Integration</div>
            <div style={{ fontSize: 13, color: "#5C5650", marginTop: 2 }}>For power users — connect Clarityboards to apps you already use</div>
          </div>
        </div>

        {/* What you can do */}
        <div style={{ background: "#EBF3FB", borderRadius: 8, padding: "16px 18px", marginBottom: 20, border: "1px solid #1B4F8A15" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1B4F8A", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Works great if you already use Zapier</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: "📧", label: "Gmail email labeled 'Action needed'", arrow: "→", result: "TaskBoard item created from subject line" },
              { icon: "📅", label: "Google Calendar event added", arrow: "→", result: "EventBoard item created with date" },
              { icon: "📊", label: "New Google Sheets row added", arrow: "→", result: "Item created in any board" },
              { icon: "🔔", label: "New Clarityboards item created", arrow: "→", result: "Slack, email, Google Sheet — anything" },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <span>{row.icon}</span>
                <span style={{ color: "#1A1714", fontWeight: 500 }}>{row.label}</span>
                <span style={{ color: "#9AABBD" }}>{row.arrow}</span>
                <span style={{ color: "#5C5650" }}>{row.result}</span>
              </div>
            ))}
          </div>
        </div>

        {/* API Key section */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #E8EDF5", padding: "20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1714", marginBottom: 4 }}>Your API Key</div>
          <div style={{ fontSize: 12, color: "#5C5650", marginBottom: 16, lineHeight: 1.5 }}>
            Generate a key and paste it into Zapier when setting up your Clarityboards connection. Keep it secret — it gives full access to your boards.
          </div>

          {loading ? (
            <div style={{ fontSize: 13, color: "#9AABBD" }}>Loading…</div>
          ) : newKey ? (
            /* Show new key once */
            <div>
              <div style={{ background: "#1A1714", borderRadius: 10, padding: "14px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
                <code style={{ flex: 1, fontSize: 12, color: "#7ECFEA", fontFamily: "'DM Mono', monospace", wordBreak: "break-all" }}>{newKey}</code>
                <button onClick={copy} style={{ background: copied ? "#27AE60" : "#1B4F8A", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <div style={{ background: "#FEF9E7", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#7D6608", border: "1px solid #F9E79F", marginBottom: 16 }}>
                ⚠ Copy this key now — it won't be shown again. Store it somewhere safe.
              </div>
              <button onClick={revoke} style={{ fontSize: 12, color: "#E74C3C", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Revoke this key
              </button>
            </div>
          ) : keyInfo?.exists ? (
            /* Key exists but not showing full value */
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F7FAFE", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#27AE60" }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1714" }}>API key active</div>
                  <div style={{ fontSize: 11, color: "#9AABBD", fontFamily: "'DM Mono', monospace" }}>
                    {keyInfo.prefix}••••••••••••••••••••
                    {keyInfo.last_used && ` · Last used ${new Date(keyInfo.last_used).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={generate} disabled={generating} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #E8EDF5", background: "#F7FAFE", fontSize: 13, fontWeight: 600, color: "#1A1714", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  Regenerate key
                </button>
                <button onClick={revoke} disabled={revoking} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #FADBD8", background: "#FEF0F0", fontSize: 13, fontWeight: 600, color: "#E74C3C", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {revoking ? "Revoking…" : "Revoke key"}
                </button>
              </div>
            </div>
          ) : (
            /* No key yet */
            <button onClick={generate} disabled={generating} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #FF4A00, #FF6D3B)", fontSize: 14, fontWeight: 700, color: "white", cursor: generating ? "not-allowed" : "pointer", boxShadow: "0 3px 14px rgba(255,74,0,0.3)", fontFamily: "'DM Sans', sans-serif" }}>
              {generating ? "Generating…" : "⚡ Generate API Key"}
            </button>
          )}
        </div>

        {/* Setup instructions */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #E8EDF5", padding: "20px", marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1714", marginBottom: 14 }}>How to connect in Zapier</div>
          {[
            "Go to zapier.com and sign in (free account works for simple automations)",
            "Click Create Zap and choose your trigger app (e.g. Gmail, Google Calendar, Sheets)",
            "For the Action, choose Webhooks by Zapier → POST",
            "Set the URL to clarityboards.com/api/zapier?action=create and add your API key as a Bearer token header",
            "Map your trigger data to the board, title, and date fields — then turn it on",
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < 4 ? 12 : 0 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#FF4A00", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: 13, color: "#444", lineHeight: 1.5, paddingTop: 2 }}>{step}</div>
            </div>
          ))}
        </div>

        {/* Zapier link */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <div style={{ background: "#EBF3FB", borderRadius: 12, padding: "14px 16px", textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1B4F8A", marginBottom: 4 }}>💡 Not a Zapier user?</div>
            <div style={{ fontSize: 12, color: "#5C5650", lineHeight: 1.6 }}>Try <strong>Watch &amp; Alert</strong> instead — it monitors prices, appointments, and page changes automatically with no third-party account needed.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

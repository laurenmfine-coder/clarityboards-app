"use client";

/**
 * Clarityboards — Notification Settings
 * File: app/settings/notifications/page.tsx
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState({
    digest_enabled: false,
    digest_time: "07:00",
    push_enabled: false,
    push_due_today: true,
    push_overdue: true,
  });
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    setPushSupported("Notification" in window && "serviceWorker" in navigator);
    if ("Notification" in window) setPushPermission(Notification.permission);

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase
        .from("notification_prefs")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) setPrefs({
        digest_enabled: data.digest_enabled,
        digest_time: data.digest_time,
        push_enabled: data.push_enabled,
        push_due_today: data.push_due_today,
        push_overdue: data.push_overdue,
      });
      setLoading(false);
    });
  }, []);

  const requestPushPermission = async () => {
    const permission = await Notification.requestPermission();
    setPushPermission(permission);
    if (permission === "granted") {
      setPrefs(p => ({ ...p, push_enabled: true }));
    }
  };

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("notification_prefs").upsert({
      user_id: user.id,
      ...prefs,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
        background: value ? "#2874A6" : "#D5DDE8",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: value ? 21 : 3,
        width: 20, height: 20, borderRadius: "50%", background: "white",
        transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }} />
    </button>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#F4F7FA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap'); * { box-sizing: border-box; }`}</style>

      <div style={{ background: "#1A2B3C", padding: "0 16px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", height: 56, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{ color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>← Back</button>
          <span style={{ marginLeft: "auto", fontFamily: "'DM Serif Display', serif", color: "rgba(255,255,255,0.9)", fontSize: 16 }}>Notifications</span>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 16px 80px" }}>

        {loading ? (
          <div style={{ textAlign: "center", color: "#9AABBD", paddingTop: 40 }}>Loading…</div>
        ) : (
          <>
            {/* Daily Digest */}
            <div style={{ background: "white", borderRadius: 14, border: "1px solid #E8EDF5", overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #F0F4F8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📧</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1A2B3C" }}>Daily Digest Email</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#5A7A94", marginTop: 3 }}>A summary of what's due today and tomorrow</div>
                </div>
                <Toggle value={prefs.digest_enabled} onChange={v => setPrefs(p => ({ ...p, digest_enabled: v }))} />
              </div>
              {prefs.digest_enabled && (
                <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#5A7A94" }}>Send at</span>
                  <input
                    type="time"
                    value={prefs.digest_time}
                    onChange={e => setPrefs(p => ({ ...p, digest_time: e.target.value }))}
                    style={{ fontSize: 13, fontWeight: 600, color: "#1A2B3C", border: "1px solid #E8EDF5", borderRadius: 8, padding: "6px 10px", background: "#F7FAFE", fontFamily: "inherit" }}
                  />
                </div>
              )}
            </div>

            {/* Push Notifications */}
            <div style={{ background: "white", borderRadius: 14, border: "1px solid #E8EDF5", overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "16px 20px", borderBottom: prefs.push_enabled ? "1px solid #F0F4F8" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🔔</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1A2B3C" }}>Push Notifications</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#5A7A94", marginTop: 3 }}>
                    {!pushSupported ? "Not supported in this browser" :
                      pushPermission === "denied" ? "Blocked — enable in browser settings" :
                      "Reminders on your device"}
                  </div>
                </div>
                {pushSupported && pushPermission !== "denied" && (
                  pushPermission === "granted"
                    ? <Toggle value={prefs.push_enabled} onChange={v => setPrefs(p => ({ ...p, push_enabled: v }))} />
                    : <button onClick={requestPushPermission} style={{ background: "#2874A6", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer", fontFamily: "inherit" }}>Enable</button>
                )}
              </div>
              {prefs.push_enabled && pushPermission === "granted" && (
                <div style={{ padding: "4px 0" }}>
                  {[
                    { key: "push_due_today", label: "Items due today", icon: "📅" },
                    { key: "push_overdue", label: "Overdue items", icon: "⚠️" },
                  ].map(({ key, label, icon }) => (
                    <div key={key} style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{icon}</span>
                        <span style={{ fontSize: 13, color: "#1A2B3C" }}>{label}</span>
                      </div>
                      <Toggle
                        value={(prefs as any)[key]}
                        onChange={v => setPrefs(p => ({ ...p, [key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save button */}
            <button
              onClick={save}
              disabled={saving}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: saved ? "#27AE60" : "#1A2B3C",
                fontSize: 14, fontWeight: 700, color: "white",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "background 0.2s", fontFamily: "inherit",
              }}
            >
              {saved ? "✓ Saved" : saving ? "Saving…" : "Save Preferences"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

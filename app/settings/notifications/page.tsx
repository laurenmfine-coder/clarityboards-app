"use client";

/**
 * Clarityboards — Notification Settings (Feature #5 complete)
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
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    setPushSupported(supported);
    if ("Notification" in window) setPushPermission(Notification.permission);
    if (supported) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => setPushSubscribed(!!sub));
      });
    }
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase.from("notification_prefs").select("*").eq("user_id", user.id).single();
      if (data) setPrefs({ digest_enabled: data.digest_enabled, digest_time: data.digest_time, push_enabled: data.push_enabled, push_due_today: data.push_due_today, push_overdue: data.push_overdue });
      setLoading(false);
    });
  }, []);

  const subscribePush = async () => {
    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission !== "granted") { setPushLoading(false); return; }
      const keyRes = await fetch("/api/push");
      const { publicKey } = await keyRes.json();
      if (!publicKey) throw new Error("Push not configured");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      const { data: { session } } = await supabase.auth.getSession();
      await fetch("/api/push?action=subscribe", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` }, body: JSON.stringify({ subscription: sub.toJSON() }) });
      setPushSubscribed(true);
      setPrefs(p => ({ ...p, push_enabled: true }));
    } catch (err) {
      console.error("[push]", err);
      alert("Failed to enable push notifications. Check browser settings.");
    }
    setPushLoading(false);
  };

  const unsubscribePush = async () => {
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch("/api/push?action=unsubscribe", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setPushSubscribed(false);
      setPrefs(p => ({ ...p, push_enabled: false }));
    } catch (err) { console.error("[push]", err); }
    setPushLoading(false);
  };

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notification_prefs").upsert({ user_id: user.id, ...prefs, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)} style={{ width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer", background: value ? "#1B4F8A" : "#D5DDE8", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: value ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
    </button>
  );

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
            Notifications
          </span>
        </div>
      </nav>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 16px 80px" }}>
        {loading ? <div style={{ textAlign: "center", color: "#9AABBD", paddingTop: 40 }}>Loading…</div> : (
          <>
            {/* Daily Digest */}
            <div style={{ background: "white", borderRadius: 8, border: "1px solid #E8EDF5", overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "16px 20px", borderBottom: prefs.digest_enabled ? "1px solid #F0F4F8" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 18 }}>📧</span><span style={{ fontSize: 14, fontWeight: 700, color: "#1A1714" }}>Daily Digest Email</span></div>
                  <div style={{ fontSize: 12, color: "#5C5650", marginTop: 3 }}>A summary of what's due today and tomorrow</div>
                </div>
                <Toggle value={prefs.digest_enabled} onChange={v => setPrefs(p => ({ ...p, digest_enabled: v }))} />
              </div>
              {prefs.digest_enabled && (
                <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#5C5650" }}>Send at</span>
                  <input type="time" value={prefs.digest_time} onChange={e => setPrefs(p => ({ ...p, digest_time: e.target.value }))} style={{ fontSize: 13, fontWeight: 600, color: "#1A1714", border: "1px solid #E8EDF5", borderRadius: 8, padding: "6px 10px", background: "#F7FAFE", fontFamily: "inherit" }} />
                </div>
              )}
            </div>

            {/* Push Notifications */}
            <div style={{ background: "white", borderRadius: 8, border: "1px solid #E8EDF5", overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "16px 20px", borderBottom: (prefs.push_enabled && pushSubscribed) ? "1px solid #F0F4F8" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 18 }}>🔔</span><span style={{ fontSize: 14, fontWeight: 700, color: "#1A1714" }}>Push Notifications</span></div>
                  <div style={{ fontSize: 12, color: "#5C5650", marginTop: 3 }}>
                    {!pushSupported ? "Not supported in this browser" : pushPermission === "denied" ? "Blocked — enable in browser settings" : pushSubscribed ? "Active on this device" : "Get reminders on this device"}
                  </div>
                </div>
                {pushSupported && pushPermission !== "denied" && (
                  pushSubscribed ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Toggle value={prefs.push_enabled} onChange={v => setPrefs(p => ({ ...p, push_enabled: v }))} />
                      <button onClick={unsubscribePush} disabled={pushLoading} style={{ background: "none", border: "1px solid #E8EDF5", borderRadius: 8, padding: "5px 10px", fontSize: 11, color: "#9AABBD", cursor: "pointer", fontFamily: "inherit" }}>{pushLoading ? "…" : "Remove"}</button>
                    </div>
                  ) : (
                    <button onClick={subscribePush} disabled={pushLoading} style={{ background: "#1A1714", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: "white", cursor: pushLoading ? "wait" : "pointer", fontFamily: "inherit", opacity: pushLoading ? 0.7 : 1 }}>{pushLoading ? "Enabling…" : "Enable"}</button>
                  )
                )}
              </div>
              {prefs.push_enabled && pushSubscribed && (
                <div style={{ padding: "4px 0" }}>
                  {[{ key: "push_due_today", label: "Items due today", icon: "📅" }, { key: "push_overdue", label: "Overdue items", icon: "⚠️" }].map(({ key, label, icon }) => (
                    <div key={key} style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 16 }}>{icon}</span><span style={{ fontSize: 13, color: "#1A1714" }}>{label}</span></div>
                      <Toggle value={(prefs as any)[key]} onChange={v => setPrefs(p => ({ ...p, [key]: v }))} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {pushSupported && !pushSubscribed && pushPermission !== "denied" && (
              <div style={{ background: "#EBF3FB", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: "#5C5650", lineHeight: 1.5 }}>
                💡 Works on Chrome, Edge, Firefox, and Android. On iPhone, add Clarityboards to your Home Screen first (Safari → Share → Add to Home Screen).
              </div>
            )}

            <button onClick={save} disabled={saving} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: saved ? "#27AE60" : "#1A1714", fontSize: 14, fontWeight: 700, color: "white", cursor: saving ? "not-allowed" : "pointer", transition: "background 0.2s", fontFamily: "inherit" }}>
              {saved ? "✓ Saved" : saving ? "Saving…" : "Save Preferences"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

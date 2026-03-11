/**
 * Clarityboards — useGoogleCalendarSync hook
 * File: lib/useGoogleCalendarSync.ts
 *
 * Drop-in React hook for two-way Google Calendar sync.
 * Call from any component that renders items (dashboard, item detail, etc.)
 *
 * Usage:
 *   const { pushItem, pullEvents, removeFromCal, syncing, lastSynced, error } = useGoogleCalendarSync();
 *
 *   // Push one item to Google Calendar
 *   await pushItem(item.id);
 *
 *   // Pull all upcoming Google Calendar events into Clarityboards
 *   const result = await pullEvents();
 *   console.log(`Imported ${result.imported} events`);
 *
 *   // Remove an item's linked Google Calendar event
 *   await removeFromCal(item.id);
 */

"use client";

import { useState, useCallback } from "react";

interface SyncResult {
  success?: boolean;
  imported?: number;
  gcal_event_id?: string;
  gcal_link?: string;
  events?: { title: string; date: string }[];
  message?: string;
  error?: string;
}

interface UseGoogleCalendarSync {
  pushItem: (itemId: string) => Promise<SyncResult>;
  pullEvents: () => Promise<SyncResult>;
  removeFromCal: (itemId: string) => Promise<SyncResult>;
  syncing: boolean;
  lastSynced: Date | null;
  error: string | null;
}

export function useGoogleCalendarSync(): UseGoogleCalendarSync {
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callApi = useCallback(async (
    method: "GET" | "POST" | "DELETE",
    body?: Record<string, any>,
    params?: Record<string, string>
  ): Promise<SyncResult> => {
    setSyncing(true);
    setError(null);

    try {
      const url = new URL("/api/gcal", window.location.origin);
      if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

      const res = await fetch(url.toString(), {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      const data: SyncResult = await res.json();

      if (!res.ok || data.error) {
        const msg = data.error ?? `HTTP ${res.status}`;
        setError(msg);
        return { error: msg };
      }

      setLastSynced(new Date());
      return data;
    } catch (err: any) {
      const msg = err.message ?? "Unknown error";
      setError(msg);
      return { error: msg };
    } finally {
      setSyncing(false);
    }
  }, []);

  /** Push a single Clarityboards item to Google Calendar */
  const pushItem = useCallback(
    (itemId: string) => callApi("POST", { item_id: itemId }),
    [callApi]
  );

  /** Pull upcoming Google Calendar events into Clarityboards (EventBoard) */
  const pullEvents = useCallback(
    () => callApi("GET", undefined, { action: "pull" }),
    [callApi]
  );

  /** Remove a Clarityboards item's linked Google Calendar event */
  const removeFromCal = useCallback(
    (itemId: string) => callApi("DELETE", { item_id: itemId }),
    [callApi]
  );

  return { pushItem, pullEvents, removeFromCal, syncing, lastSynced, error };
}

// ─── Standalone helper (non-hook context, e.g. server actions) ───────────────

/**
 * Call from a server action or outside React if needed.
 * Requires a valid fetch-compatible environment (Next.js server components).
 */
export async function syncItemToGcal(itemId: string, baseUrl: string) {
  const res = await fetch(`${baseUrl}/api/gcal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_id: itemId }),
  });
  return res.json();
}

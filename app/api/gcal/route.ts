/**
 * Clarityboards — Google Calendar Sync API Route
 * File: app/api/gcal/route.ts
 *
 * Handles two-way sync between Clarityboards items and Google Calendar.
 *
 * Endpoints:
 *   GET  /api/gcal?action=pull   — Import upcoming Google Calendar events into Clarityboards
 *   POST /api/gcal               — Push a Clarityboards item to Google Calendar
 *   DELETE /api/gcal             — Remove a Google Calendar event by gcal_event_id
 *
 * Prerequisites:
 *   1. In Google Cloud Console → your OAuth client → add scope:
 *      https://www.googleapis.com/auth/calendar.events
 *   2. In Supabase → update your items table (run schema below)
 *   3. In supabase.ts → store provider_token on session (see note below)
 *   4. Add GOOGLE_CALENDAR_ID to .env.local (usually "primary")
 *
 * Supabase schema additions (run in Supabase SQL editor):
 *   ALTER TABLE items ADD COLUMN IF NOT EXISTS gcal_event_id TEXT;
 *   ALTER TABLE items ADD COLUMN IF NOT EXISTS gcal_synced_at TIMESTAMPTZ;
 *   ALTER TABLE items ADD COLUMN IF NOT EXISTS gcal_sync_enabled BOOLEAN DEFAULT false;
 *
 * supabase.ts note — persist the Google OAuth token:
 *   In your createServerClient call, add:
 *   auth: { persistSession: true }
 *   Then access via: session.provider_token
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const GCAL_BASE = "https://www.googleapis.com/calendar/v3";
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? "primary";

// ─── Board → Google Calendar color mapping ───────────────────────────────────
// Google Calendar colorId reference: 1=Lavender 2=Sage 3=Grape 4=Flamingo
// 5=Banana 6=Tangerine 7=Peacock 8=Graphite 9=Blueberry 10=Basil 11=Tomato
const BOARD_COLOR_MAP: Record<string, string> = {
  event:    "9",  // Blueberry  → matches EventBoard #1B4F8A
  study:    "2",  // Sage       → matches StudyBoard #2E9E8F
  activity: "6",  // Tangerine  → matches ActivityBoard #E67E22
  career:   "3",  // Grape      → matches CareerBoard #8E44AD
  task:     "10", // Basil      → matches TaskBoard #27AE60
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
}

async function getProviderToken(supabase: ReturnType<typeof makeSupabaseClient>) {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) throw new Error("Not authenticated");
  if (!session.provider_token) throw new Error(
    "No Google provider_token on session. " +
    "Make sure you requested the calendar.events scope during OAuth."
  );
  return { token: session.provider_token, userId: session.user.id };
}

async function gcalFetch(token: string, path: string, options: RequestInit = {}) {
  const res = await fetch(`${GCAL_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar API error ${res.status}: ${err}`);
  }
  return res.status === 204 ? null : res.json();
}

/** Convert a Clarityboards item into a Google Calendar event body */
function itemToGcalEvent(item: {
  title: string;
  date: string;
  notes?: string;
  board: string;
  status?: string;
}) {
  // Clarityboards dates are YYYY-MM-DD (all-day events)
  const nextDay = new Date(item.date);
  nextDay.setDate(nextDay.getDate() + 1);
  const endDate = nextDay.toISOString().split("T")[0];

  const descParts = [];
  if (item.status) descParts.push(`Status: ${item.status}`);
  if (item.notes) descParts.push(item.notes);
  descParts.push("— Added via Clarityboards");

  return {
    summary: item.title,
    description: descParts.join("\n"),
    start: { date: item.date },
    end: { date: endDate },
    colorId: BOARD_COLOR_MAP[item.board] ?? "1",
    extendedProperties: {
      private: {
        clarityboards: "true",
        board: item.board,
      },
    },
  };
}

/** Convert a Google Calendar event into a Clarityboards item shape */
function gcalEventToItem(event: Record<string, any>, userId: string) {
  const date =
    event.start?.date ??
    event.start?.dateTime?.split("T")[0] ??
    new Date().toISOString().split("T")[0];

  return {
    user_id: userId,
    board: "event" as const,          // pulled events default to EventBoard
    title: event.summary ?? "Untitled Event",
    date,
    notes: event.description ?? "",
    status: "rsvp-needed",
    checklist: [],
    gcal_event_id: event.id,
    gcal_synced_at: new Date().toISOString(),
    gcal_sync_enabled: true,
  };
}

// ─── GET — Pull Google Calendar events into Clarityboards ────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = makeSupabaseClient();
    const { token, userId } = await getProviderToken(supabase);

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action !== "pull") {
      return NextResponse.json({ error: "Unknown action. Use ?action=pull" }, { status: 400 });
    }

    // Fetch events from now → 90 days out
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const data = await gcalFetch(
      token,
      `/calendars/${encodeURIComponent(CALENDAR_ID)}/events?` +
      `timeMin=${encodeURIComponent(timeMin)}&` +
      `timeMax=${encodeURIComponent(timeMax)}&` +
      `singleEvents=true&orderBy=startTime&maxResults=50`
    );

    const events: Record<string, any>[] = data.items ?? [];

    // Filter out events already synced from Clarityboards (avoid duplicates)
    const externalEvents = events.filter(
      (e) => e.extendedProperties?.private?.clarityboards !== "true"
    );

    if (externalEvents.length === 0) {
      return NextResponse.json({ imported: 0, message: "No new external events found." });
    }

    // Get existing gcal_event_ids so we don't double-import
    const { data: existingItems } = await supabase
      .from("items")
      .select("gcal_event_id")
      .eq("user_id", userId)
      .not("gcal_event_id", "is", null);

    const existingIds = new Set((existingItems ?? []).map((i: any) => i.gcal_event_id));

    const toInsert = externalEvents
      .filter((e) => !existingIds.has(e.id))
      .map((e) => gcalEventToItem(e, userId));

    if (toInsert.length === 0) {
      return NextResponse.json({ imported: 0, message: "All events already imported." });
    }

    const { error: insertError } = await supabase.from("items").insert(toInsert);
    if (insertError) throw insertError;

    return NextResponse.json({
      imported: toInsert.length,
      events: toInsert.map((i) => ({ title: i.title, date: i.date })),
    });

  } catch (err: any) {
    console.error("[gcal GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST — Push a Clarityboards item to Google Calendar ─────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = makeSupabaseClient();
    const { token, userId } = await getProviderToken(supabase);

    const body = await req.json();
    const { item_id } = body;

    if (!item_id) {
      return NextResponse.json({ error: "item_id required" }, { status: 400 });
    }

    // Fetch the item from Supabase
    const { data: item, error: fetchError } = await supabase
      .from("items")
      .select("*")
      .eq("id", item_id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const eventBody = itemToGcalEvent(item);

    let gcalEvent: Record<string, any>;

    if (item.gcal_event_id) {
      // Update existing Google Calendar event
      gcalEvent = await gcalFetch(
        token,
        `/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${item.gcal_event_id}`,
        { method: "PUT", body: JSON.stringify(eventBody) }
      );
    } else {
      // Create new Google Calendar event
      gcalEvent = await gcalFetch(
        token,
        `/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
        { method: "POST", body: JSON.stringify(eventBody) }
      );
    }

    // Save gcal_event_id back to Supabase
    const { error: updateError } = await supabase
      .from("items")
      .update({
        gcal_event_id: gcalEvent.id,
        gcal_synced_at: new Date().toISOString(),
        gcal_sync_enabled: true,
      })
      .eq("id", item_id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      gcal_event_id: gcalEvent.id,
      gcal_link: gcalEvent.htmlLink,
    });

  } catch (err: any) {
    console.error("[gcal POST]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE — Remove event from Google Calendar ───────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const supabase = makeSupabaseClient();
    const { token, userId } = await getProviderToken(supabase);

    const body = await req.json();
    const { item_id } = body;

    if (!item_id) {
      return NextResponse.json({ error: "item_id required" }, { status: 400 });
    }

    const { data: item, error: fetchError } = await supabase
      .from("items")
      .select("gcal_event_id")
      .eq("id", item_id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !item?.gcal_event_id) {
      return NextResponse.json({ error: "No linked Google Calendar event found" }, { status: 404 });
    }

    // Delete from Google Calendar
    await gcalFetch(
      token,
      `/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${item.gcal_event_id}`,
      { method: "DELETE" }
    );

    // Clear gcal fields in Supabase
    await supabase
      .from("items")
      .update({ gcal_event_id: null, gcal_synced_at: null, gcal_sync_enabled: false })
      .eq("id", item_id);

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("[gcal DELETE]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

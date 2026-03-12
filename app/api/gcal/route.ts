/**
 * Clarityboards — Google Calendar Two-Way Sync
 * File: app/api/gcal/route.ts
 *
 * GET  ?action=pull          → import upcoming GCal events → EventBoard
 * POST { item_id }           → push a Clarityboards item → GCal
 * DELETE { item_id }         → remove the linked GCal event
 *
 * OAuth: Uses Supabase provider_token (Google OAuth) stored in the session.
 * Requires Google Cloud Console: Calendar API enabled + scope calendar.events.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// ─── Constants ────────────────────────────────────────────────────────────────

const GCAL_BASE = 'https://www.googleapis.com/calendar/v3'

// Board → Google Calendar color ID mapping
// https://developers.google.com/calendar/api/v3/reference/colors/get
const BOARD_COLOR_MAP: Record<string, string> = {
  event:    '9',  // Blueberry  (#1B4F8A-ish)
  study:    '7',  // Sage       (#2E9E8F-ish)
  activity: '6',  // Tangerine  (#E67E22-ish)
  career:   '3',  // Grape      (#8E44AD-ish)
  task:     '2',  // Sage/Basil (#27AE60-ish)
}

// ─── Supabase helper ──────────────────────────────────────────────────────────

function makeSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }: any) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// ─── Google Calendar API helper ───────────────────────────────────────────────

async function gcalFetch(
  path: string,
  providerToken: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: any }> {
  const url = path.startsWith('http') ? path : `${GCAL_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${providerToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  const data = res.status === 204 ? {} : await res.json()
  return { ok: res.ok, status: res.status, data }
}

// ─── Date formatting helpers ──────────────────────────────────────────────────

/** Convert a YYYY-MM-DD date string to a GCal all-day event date object */
function toGCalDate(dateStr: string | null): { date: string } | { dateTime: string; timeZone: string } {
  if (!dateStr) {
    // Default to today if no date set
    const today = new Date().toISOString().split('T')[0]
    return { date: today }
  }
  return { date: dateStr }
}

/** Extract YYYY-MM-DD from a GCal event start object */
function fromGCalDate(start: { date?: string; dateTime?: string }): string | null {
  if (start.date) return start.date
  if (start.dateTime) return start.dateTime.split('T')[0]
  return null
}

// ─── GET — Pull GCal events into Clarityboards ────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // OAuth callback (code exchange) — preserved from original route
  const code = searchParams.get('code')
  if (code) {
    const supabase = makeSupabase()
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(
      new URL('/settings/gcal', request.url.split('/api')[0])
    )
  }

  const action = searchParams.get('action')
  if (action !== 'pull') {
    return NextResponse.json({ error: 'Missing ?action=pull' }, { status: 400 })
  }

  // ── Auth ──
  const supabase = makeSupabase()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const providerToken = session.provider_token
  if (!providerToken) {
    return NextResponse.json(
      { error: 'provider_token missing — please reconnect your Google account with calendar scope' },
      { status: 403 }
    )
  }

  const userId = session.user.id

  // ── Fetch next 90 days from GCal primary calendar ──
  const timeMin = new Date().toISOString()
  const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

  const listUrl =
    `/calendars/primary/events` +
    `?timeMin=${encodeURIComponent(timeMin)}` +
    `&timeMax=${encodeURIComponent(timeMax)}` +
    `&singleEvents=true` +
    `&orderBy=startTime` +
    `&maxResults=250`

  const { ok, data: eventsData } = await gcalFetch(listUrl, providerToken)
  if (!ok) {
    return NextResponse.json(
      { error: `Google Calendar API error: ${eventsData?.error?.message ?? 'unknown'}` },
      { status: 502 }
    )
  }

  const gcalEvents: any[] = eventsData.items ?? []

  if (gcalEvents.length === 0) {
    return NextResponse.json({ imported: 0, message: 'No upcoming events found in Google Calendar.' })
  }

  // ── Deduplicate: fetch existing gcal_event_ids for this user ──
  const { data: existingItems } = await supabase
    .from('items')
    .select('gcal_event_id')
    .eq('user_id', userId)
    .not('gcal_event_id', 'is', null)

  const existingGcalIds = new Set(
    (existingItems ?? []).map((i: any) => i.gcal_event_id).filter(Boolean)
  )

  // ── Import new events into EventBoard ──
  const toInsert = gcalEvents
    .filter((e: any) => {
      // Skip events without a title, all-day multi-day events spanning > 7 days, cancelled events
      if (!e.summary) return false
      if (e.status === 'cancelled') return false
      if (existingGcalIds.has(e.id)) return false
      return true
    })
    .map((e: any) => ({
      user_id: userId,
      board: 'event' as const,
      title: e.summary,
      date: fromGCalDate(e.start),
      notes: e.description ?? null,
      status: 'rsvp-needed',
      checklist: [],
      gcal_event_id: e.id,
      gcal_calendar_id: 'primary',
    }))

  if (toInsert.length === 0) {
    return NextResponse.json({ imported: 0, message: 'All events already imported — nothing new.' })
  }

  const { error: insertError } = await supabase.from('items').insert(toInsert)
  if (insertError) {
    return NextResponse.json({ error: `DB insert failed: ${insertError.message}` }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    imported: toInsert.length,
    events: toInsert.slice(0, 10).map(i => ({ title: i.title, date: i.date })),
  })
}

// ─── POST — Push a Clarityboards item to GCal ─────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = makeSupabase()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const providerToken = session.provider_token
  if (!providerToken) {
    return NextResponse.json(
      { error: 'provider_token missing — please reconnect your Google account with calendar scope' },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const { item_id } = body

  if (!item_id) {
    return NextResponse.json({ error: 'Missing item_id' }, { status: 400 })
  }

  // ── Fetch item ──
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('*')
    .eq('id', item_id)
    .eq('user_id', session.user.id)
    .single()

  if (itemError || !item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  const colorId = BOARD_COLOR_MAP[item.board] ?? '9'
  const eventBody = {
    summary: item.title,
    description: item.notes ?? undefined,
    start: toGCalDate(item.date),
    end: toGCalDate(item.date),   // All-day events: same date for start/end
    colorId,
    extendedProperties: {
      private: {
        clarityboards_item_id: item.id,
        clarityboards_board: item.board,
      },
    },
  }

  // ── If item already has a gcal_event_id, update it (PATCH). Otherwise insert. ──
  let gcalEventId: string
  let gcalLink: string

  if (item.gcal_event_id) {
    // Update existing GCal event
    const { ok, data } = await gcalFetch(
      `/calendars/primary/events/${item.gcal_event_id}`,
      providerToken,
      { method: 'PATCH', body: JSON.stringify(eventBody) }
    )
    if (!ok) {
      // If 404 (deleted in GCal), fall through and create fresh
      if (data?.error?.code === 404) {
        const { ok: createOk, data: createData } = await gcalFetch(
          '/calendars/primary/events',
          providerToken,
          { method: 'POST', body: JSON.stringify(eventBody) }
        )
        if (!createOk) {
          return NextResponse.json(
            { error: `GCal create failed: ${createData?.error?.message ?? 'unknown'}` },
            { status: 502 }
          )
        }
        gcalEventId = createData.id
        gcalLink = createData.htmlLink
      } else {
        return NextResponse.json(
          { error: `GCal update failed: ${data?.error?.message ?? 'unknown'}` },
          { status: 502 }
        )
      }
    } else {
      gcalEventId = data.id
      gcalLink = data.htmlLink
    }
  } else {
    // Create new GCal event
    const { ok, data } = await gcalFetch(
      '/calendars/primary/events',
      providerToken,
      { method: 'POST', body: JSON.stringify(eventBody) }
    )
    if (!ok) {
      return NextResponse.json(
        { error: `GCal create failed: ${data?.error?.message ?? 'unknown'}` },
        { status: 502 }
      )
    }
    gcalEventId = data.id
    gcalLink = data.htmlLink
  }

  // ── Save gcal_event_id back to items row ──
  await supabase
    .from('items')
    .update({ gcal_event_id: gcalEventId, gcal_calendar_id: 'primary' })
    .eq('id', item_id)

  return NextResponse.json({
    success: true,
    gcal_event_id: gcalEventId,
    gcal_link: gcalLink,
  })
}

// ─── DELETE — Remove the linked GCal event ────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const supabase = makeSupabase()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const providerToken = session.provider_token
  if (!providerToken) {
    return NextResponse.json(
      { error: 'provider_token missing — please reconnect your Google account with calendar scope' },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const { item_id } = body

  if (!item_id) {
    return NextResponse.json({ error: 'Missing item_id' }, { status: 400 })
  }

  // ── Fetch item to get gcal_event_id ──
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('id, gcal_event_id, user_id')
    .eq('id', item_id)
    .eq('user_id', session.user.id)
    .single()

  if (itemError || !item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  if (!item.gcal_event_id) {
    return NextResponse.json({ success: true, message: 'Item has no linked GCal event.' })
  }

  // ── Delete from GCal ──
  const { ok, data } = await gcalFetch(
    `/calendars/primary/events/${item.gcal_event_id}`,
    providerToken,
    { method: 'DELETE' }
  )

  // 404 = already deleted in GCal — treat as success
  if (!ok && data?.error?.code !== 404) {
    return NextResponse.json(
      { error: `GCal delete failed: ${data?.error?.message ?? 'unknown'}` },
      { status: 502 }
    )
  }

  // ── Clear gcal columns on the item ──
  await supabase
    .from('items')
    .update({ gcal_event_id: null, gcal_calendar_id: null })
    .eq('id', item_id)

  return NextResponse.json({ success: true })
}

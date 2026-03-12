export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ── Minimal iCal parser (no external deps) ────────────────────────────────────
// Handles VEVENT blocks, extracts SUMMARY, DTSTART, DTEND, UID, DESCRIPTION
interface ParsedEvent {
  uid: string
  title: string
  date: string | null        // YYYY-MM-DD
  description: string | null
}

function parseICS(raw: string): ParsedEvent[] {
  const events: ParsedEvent[] = []
  // Unfold long lines (iCal wraps at 75 chars with CRLF + space/tab)
  const unfolded = raw.replace(/\r?\n[ \t]/g, '')
  const lines = unfolded.split(/\r?\n/)

  let inEvent = false
  let current: Partial<ParsedEvent> = {}

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { inEvent = true; current = {}; continue }
    if (line === 'END:VEVENT') {
      if (inEvent && current.uid && current.title) {
        events.push({
          uid:         current.uid,
          title:       current.title,
          date:        current.date ?? null,
          description: current.description ?? null,
        })
      }
      inEvent = false
      continue
    }
    if (!inEvent) continue

    // Property name is everything before first ':' or ';'
    const sepIdx = line.search(/[:;]/)
    if (sepIdx === -1) continue
    const propName = line.slice(0, sepIdx).toUpperCase().split(';')[0]
    const value    = line.slice(line.indexOf(':') + 1).trim()

    switch (propName) {
      case 'UID':         current.uid         = value; break
      case 'SUMMARY':     current.title       = unescapeICS(value); break
      case 'DESCRIPTION': current.description = unescapeICS(value); break
      case 'DTSTART': {
        // Could be DATE (YYYYMMDD) or DATETIME (YYYYMMDDTHHmmssZ)
        const dateOnly = value.replace(/T.*$/, '').replace(/\D/g, '')
        if (dateOnly.length >= 8) {
          current.date = `${dateOnly.slice(0,4)}-${dateOnly.slice(4,6)}-${dateOnly.slice(6,8)}`
        }
        break
      }
    }
  }

  return events
}

function unescapeICS(val: string): string {
  return val
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

// ── Board auto-detection from event title/description ──────────────────────
function detectBoard(title: string, description: string | null): string {
  const text = `${title} ${description ?? ''}`.toLowerCase()
  if (/soccer|practice|game|tournament|league|cheer|dance|swim|gymnastic|sport|lacrosse|baseball|softball|basketball|football|hockey|tennis|track|cross.?country/.test(text)) return 'activity'
  if (/assignment|due|exam|quiz|homework|class|lecture|study|course|syllabus|midterm|final|project|essay|lab|tutor/.test(text)) return 'study'
  if (/interview|career|job|application|resume|recruiter|hiring|offer|internship|networking/.test(text)) return 'career'
  return 'event'
}

// ── POST: import from a specific subscription ──────────────────────────────
// Called by the cron job OR manually from the UI
export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await req.json() as {
    subscription_id?: string  // import single sub (from UI refresh)
    user_id?: string          // required if called from cron with service role
  }

  // If called from UI — get user from session
  let userId = body.user_id
  if (!userId) {
    const cookieStore = cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = user.id
  }

  // Fetch subscription(s) to process
  let subsQuery = supabaseAdmin
    .from('ical_subscriptions')
    .select('*')
    .eq('user_id', userId)

  if (body.subscription_id) {
    subsQuery = subsQuery.eq('id', body.subscription_id)
  }

  const { data: subs, error: subErr } = await subsQuery
  if (subErr || !subs?.length) {
    return NextResponse.json({ error: 'No subscriptions found', details: subErr?.message }, { status: 404 })
  }

  const results: { sub_id: string; label: string; imported: number; skipped: number; error?: string }[] = []

  for (const sub of subs) {
    try {
      // Fetch the .ics feed
      const res = await fetch(sub.url, {
        headers: { 'User-Agent': 'Clarityboards/1.0 (+https://clarityboards.com)' },
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) {
        results.push({ sub_id: sub.id, label: sub.label, imported: 0, skipped: 0, error: `HTTP ${res.status}` })
        continue
      }

      const raw = await res.text()
      const events = parseICS(raw)

      let imported = 0
      let skipped  = 0

      for (const event of events) {
        // Skip events with no date or no title
        if (!event.date || !event.title) { skipped++; continue }

        // Skip past events (more than 7 days ago)
        const eventDate = new Date(event.date + 'T00:00:00')
        const cutoff    = new Date(Date.now() - 7 * 86400000)
        if (eventDate < cutoff) { skipped++; continue }

        // Deduplication: check if this ical_uid already exists for this user
        const { data: existing } = await supabaseAdmin
          .from('items')
          .select('id')
          .eq('user_id', userId)
          .eq('ical_uid', event.uid)
          .maybeSingle()

        if (existing) {
          // Update date/title in case the event was changed in the source calendar
          await supabaseAdmin
            .from('items')
            .update({ title: event.title, date: event.date, notes: event.description })
            .eq('id', existing.id)
          skipped++
          continue
        }

        // Auto-detect board from title + description
        const board = sub.default_board ?? detectBoard(event.title, event.description)

        await supabaseAdmin.from('items').insert({
          user_id:     userId,
          board,
          title:       event.title,
          date:        event.date,
          notes:       event.description,
          status:      'todo',
          checklist:   [],
          ical_uid:    event.uid,
          ical_sub_id: sub.id,
        })
        imported++
      }

      // Update last_synced
      await supabaseAdmin
        .from('ical_subscriptions')
        .update({ last_synced: new Date().toISOString() })
        .eq('id', sub.id)

      results.push({ sub_id: sub.id, label: sub.label ?? sub.url, imported, skipped })
    } catch (err: any) {
      results.push({ sub_id: sub.id, label: sub.label ?? sub.url, imported: 0, skipped: 0, error: err.message })
    }
  }

  const totalImported = results.reduce((sum, r) => sum + r.imported, 0)
  return NextResponse.json({ success: true, results, totalImported })
}

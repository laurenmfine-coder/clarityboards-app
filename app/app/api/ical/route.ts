import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function escapeICS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

function formatICSDate(dateStr: string): string {
  // All-day event format: YYYYMMDD
  return dateStr.replace(/-/g, '')
}

function generateUID(id: string): string {
  return `${id}@clarityboards.app`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('uid')
  const board = searchParams.get('board') // optional filter

  if (!userId) {
    return new NextResponse('Missing uid', { status: 400 })
  }

  let query = supabaseAdmin
    .from('items')
    .select('*')
    .eq('user_id', userId)
    .not('date', 'is', null)
    .not('title', 'like', '__boards__%')

  if (board) {
    query = query.eq('board', board)
  }

  const { data: items, error } = await query

  if (error) {
    return new NextResponse('Error fetching items', { status: 500 })
  }

  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'

  const boardNames: Record<string, string> = {
    event:    'EventBoard',
    study:    'StudyBoard',
    activity: 'ActivityBoard',
    career:   'CareerBoard',
    task:     'TaskBoard',
  }

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Clarityboards//Clarityboards App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Clarityboards${board ? ' – ' + boardNames[board] : ''}`,
    'X-WR-TIMEZONE:America/New_York',
    'X-WR-CALDESC:Your Clarityboards items with dates',
  ]

  for (const item of items ?? []) {
    const dateFormatted = formatICSDate(item.date)
    // All-day event ends the next day in iCal
    const nextDay = new Date(item.date + 'T00:00:00')
    nextDay.setDate(nextDay.getDate() + 1)
    const endDate = nextDay.toISOString().slice(0, 10).replace(/-/g, '')

    const boardLabel = boardNames[item.board] ?? item.board
    const description = [
      item.notes ? escapeICS(item.notes) : '',
      `Board: ${boardLabel}`,
      `Status: ${item.status}`,
      item.checklist?.length > 0
        ? `Tasks: ${item.checklist.filter((c: any) => c.done).length}/${item.checklist.length} complete`
        : '',
    ].filter(Boolean).join('\\n')

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${generateUID(item.id)}`)
    lines.push(`DTSTAMP:${now}`)
    lines.push(`DTSTART;VALUE=DATE:${dateFormatted}`)
    lines.push(`DTEND;VALUE=DATE:${endDate}`)
    lines.push(`SUMMARY:${escapeICS(item.title)}`)
    if (description) lines.push(`DESCRIPTION:${description}`)
    lines.push(`CATEGORIES:${boardLabel}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  const icsContent = lines.join('\r\n')

  return new NextResponse(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="clarityboards.ics"',
      'Cache-Control': 'no-cache, no-store',
    },
  })
}

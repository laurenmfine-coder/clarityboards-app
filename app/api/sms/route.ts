import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const BOARD_KEYWORDS: Record<string, string[]> = {
  event:    ['party', 'birthday', 'wedding', 'rsvp', 'invite', 'invitation', 'celebration', 'event', 'bat mitzvah', 'bar mitzvah', 'shower', 'graduation', 'ceremony', 'gala', 'dinner', 'fundraiser'],
  study:    ['homework', 'assignment', 'due', 'exam', 'test', 'quiz', 'essay', 'project', 'class', 'lecture', 'study', 'course', 'grade', 'submit', 'paper', 'reading'],
  activity: ['practice', 'game', 'match', 'tryout', 'meet', 'tournament', 'recital', 'performance', 'sport', 'dance', 'swim', 'soccer', 'baseball', 'basketball', 'gymnastics', 'camp'],
  career:   ['interview', 'application', 'apply', 'job', 'resume', 'follow up', 'offer', 'hiring', 'recruiter', 'linkedin', 'career', 'position', 'role', 'company'],
  task:     ['todo', 'task', 'reminder', 'errand', 'appointment', 'call', 'email', 'pay', 'buy', 'schedule', 'meeting', 'deadline'],
}

function guessBoard(text: string): string {
  const lower = text.toLowerCase()
  for (const [board, keywords] of Object.entries(BOARD_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return board
  }
  return 'task'
}

const BOARD_STATUSES: Record<string, string> = {
  event: 'rsvp-needed',
  study: 'todo',
  activity: 'todo',
  career: 'todo',
  task: 'todo',
}

export async function POST(req: NextRequest) {
  // Verify Twilio signature (basic)
  const body = await req.formData()
  const from = body.get('From') as string
  const messageBody = body.get('Body') as string

  if (!from || !messageBody) {
    return twimlResponse('Could not parse your message. Please try again.')
  }

  // Look up user by phone number
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('user_id')
    .eq('phone', from)
    .single()

  if (!profile) {
    return twimlResponse(
      `Your phone number isn't linked to a Clarityboards account. Visit clarityboards-app.vercel.app to connect your number in Settings.`
    )
  }

  // Use Claude to parse the message
  let parsed: { title: string; date: string | null; notes: string | null; board: string } | null = null

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Parse this text message into a calendar/task item. Return ONLY valid JSON with these fields:
- title: short clear title (max 60 chars)
- date: ISO date string YYYY-MM-DD if a date is mentioned, otherwise null
- notes: any extra details, location, or context (null if none)
- board: one of: event, study, activity, career, task

Message: "${messageBody}"

Return only the JSON object, no markdown.`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    parsed = JSON.parse(text.trim())
  } catch {
    // Fallback: basic parse
    const board = guessBoard(messageBody)
    parsed = {
      title: messageBody.slice(0, 60).trim(),
      date: null,
      notes: messageBody.length > 60 ? messageBody.slice(60).trim() : null,
      board,
    }
  }

  if (!parsed) {
    return twimlResponse("Sorry, I couldn't understand that. Try: \"Emma's soccer game May 15\" or \"Doctor appointment tomorrow\"")
  }

  const board = parsed.board ?? guessBoard(messageBody)

  // Insert into Supabase
  const { error } = await supabaseAdmin.from('items').insert({
    user_id: profile.user_id,
    title: parsed.title,
    date: parsed.date,
    notes: parsed.notes,
    board,
    status: BOARD_STATUSES[board] ?? 'todo',
    checklist: [],
  })

  if (error) {
    return twimlResponse('Sorry, something went wrong saving your item. Please try again.')
  }

  const boardNames: Record<string, string> = {
    event: 'EventBoard', study: 'StudyBoard', activity: 'ActivityBoard',
    career: 'CareerBoard', task: 'TaskBoard',
  }

  const dateStr = parsed.date ? ` on ${parsed.date}` : ''
  return twimlResponse(
    `✅ Added to ${boardNames[board]}: "${parsed.title}"${dateStr}. Open Clarityboards to see it!`
  )
}

function twimlResponse(message: string) {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}

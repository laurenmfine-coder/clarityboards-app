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

const BOARD_STATUSES: Record<string, string> = {
  event: 'rsvp-needed',
  study: 'todo',
  activity: 'todo',
  career: 'todo',
  task: 'todo',
}

export async function POST(req: NextRequest) {
  // Verify Postmark webhook secret
  const secret = req.headers.get('x-postmark-secret')
  if (secret !== process.env.POSTMARK_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  const toEmail: string = body.To ?? ''
  const fromEmail: string = body.From ?? ''
  const subject: string = body.Subject ?? ''
  const textBody: string = body.TextBody ?? ''
  const htmlBody: string = body.HtmlBody ?? ''

  // Extract user identifier from the To address
  // Format: forward+USERID@clarityboards.app  OR  boards@clarityboards.app (uses From lookup)
  let userId: string | null = null

  const plusMatch = toEmail.match(/forward\+([^@]+)@/)
  if (plusMatch) {
    userId = plusMatch[1]
  } else {
    // Look up by the sender's email address
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('email', fromEmail.replace(/.*<(.+)>/, '$1').trim())
      .single()
    userId = profile?.user_id ?? null
  }

  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Use the text body, strip excessive whitespace
  const content = (textBody || htmlBody.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000)

  const fullContent = `Subject: ${subject}\n\n${content}`

  // Parse with Claude
  let parsed: {
    title: string
    date: string | null
    notes: string | null
    board: string
  } | null = null

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `You are parsing a forwarded email into a structured calendar/task item for a life management app called Clarityboards.

Email content:
${fullContent}

Return ONLY a JSON object with:
- title: a short clear title summarizing the item (max 70 chars)  
- date: ISO date YYYY-MM-DD if a specific date is mentioned (event date, deadline, due date), otherwise null
- notes: key details — location, RSVP info, contact, instructions (2-3 sentences max, null if none)
- board: choose the most fitting board:
  * "event" — parties, celebrations, invitations, RSVPs, social gatherings
  * "study" — assignments, exams, deadlines, courses, academic
  * "activity" — sports, kids activities, practices, performances, camps
  * "career" — jobs, interviews, applications, networking
  * "task" — errands, appointments, reminders, general to-dos

Return only the JSON, no markdown backticks.`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    parsed = JSON.parse(text.trim())
  } catch {
    // Fallback
    parsed = {
      title: subject.slice(0, 70) || 'Forwarded email',
      date: null,
      notes: content.slice(0, 200) || null,
      board: 'task',
    }
  }

  if (!parsed) {
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 })
  }

  const { error } = await supabaseAdmin.from('items').insert({
    user_id: userId,
    title: parsed.title,
    date: parsed.date,
    notes: parsed.notes,
    board: parsed.board ?? 'task',
    status: BOARD_STATUSES[parsed.board ?? 'task'] ?? 'todo',
    checklist: [],
  })

  if (error) {
    return NextResponse.json({ error: 'Insert failed', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, board: parsed.board, title: parsed.title })
}

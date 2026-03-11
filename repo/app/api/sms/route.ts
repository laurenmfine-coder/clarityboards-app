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
  study: 'not-started',
  activity: 'todo',
  career: 'todo',
  task: 'todo',
}

const BOARD_NAMES: Record<string, string> = {
  event: 'EventBoard',
  study: 'StudyBoard',
  activity: 'ActivityBoard',
  career: 'CareerBoard',
  task: 'TaskBoard',
}

const BOARD_KEYWORDS: Record<string, string[]> = {
  event:    ['party', 'birthday', 'wedding', 'rsvp', 'invite', 'invitation', 'celebration', 'bat mitzvah', 'bar mitzvah', 'shower', 'graduation', 'ceremony', 'gala', 'dinner', 'fundraiser'],
  study:    ['homework', 'assignment', 'due', 'exam', 'test', 'quiz', 'essay', 'project', 'class', 'lecture', 'study', 'course', 'grade', 'submit', 'paper', 'reading'],
  activity: ['practice', 'game', 'match', 'tryout', 'meet', 'tournament', 'recital', 'performance', 'sport', 'dance', 'swim', 'soccer', 'baseball', 'basketball', 'gymnastics', 'camp'],
  career:   ['interview', 'application', 'apply', 'job', 'resume', 'follow up', 'offer', 'hiring', 'recruiter', 'linkedin', 'career', 'position', 'role'],
  task:     ['todo', 'task', 'reminder', 'errand', 'appointment', 'call', 'email', 'pay', 'buy', 'schedule', 'meeting', 'deadline', 'pick up', 'drop off'],
}

function guessBoard(text: string): string {
  const lower = text.toLowerCase()
  for (const [board, keywords] of Object.entries(BOARD_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return board
  }
  return 'task'
}

function formatDateForReply(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

interface ParsedItem {
  title: string
  date: string | null
  time: string | null
  notes: string | null
  board: string
  status: string
  checklist: string[]
  urgent: boolean
}

export async function POST(req: NextRequest) {
  const body = await req.formData()
  const from = body.get('From') as string
  const messageBody = (body.get('Body') as string)?.trim()

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
      `Your phone number isn't linked to a Clarityboards account. Visit clarityboards-app.vercel.app and connect your number in Settings.`
    )
  }

  const userId = profile.user_id

  // Use UTC to avoid Vercel server timezone shifting the date
  const nowUTC = new Date()
  const todayISO = nowUTC.toISOString().slice(0, 10) // e.g. "2026-03-11"
  const tomorrowISO = new Date(nowUTC.getTime() + 86400000).toISOString().slice(0, 10)
  const todayFormatted = nowUTC.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  // ── Claude AI parse ───────────────────────────────────────────
  let aiResult: {
    action: 'add' | 'update' | 'delete' | 'complete' | 'multi'
    items?: ParsedItem[]
    update?: { search: string; changes: Partial<ParsedItem> }
    delete?: { search: string }
    complete?: { search: string }
  } | null = null

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `You are parsing a text message for Clarityboards, a life management app.

TODAY'S DATE: ${todayFormatted}
TODAY IN ISO FORMAT: ${todayISO}
TOMORROW IN ISO FORMAT: ${tomorrowISO}

You MUST use these exact ISO dates as your anchor. Do not guess or calculate — use the values above directly.

Determine the action and return ONLY a JSON object. No markdown, no explanation.

ACTIONS:
1. "add" - adding one item with one date
2. "multi" - adding multiple items. Use this when:
   a) The message explicitly lists multiple separate things, OR
   b) A single event has multiple distinct milestones/deadlines (e.g. RSVP deadline + prep task + the event itself). In this case, split into separate items — one per milestone — each with its own date.
3. "update" - updating an existing item (e.g. "change soccer game to Friday")
4. "delete" - deleting an item (e.g. "delete the dentist appointment")
5. "complete" - marking an item done (e.g. "mark homework done", "finished the interview")

MILESTONE SPLITTING RULES — always split into multiple items when you detect:
- An RSVP deadline AND an event date → create "RSVP: [Event]" (rsvp-needed, rsvp date) + "[Event]" (accepted, event date)
- A prep task AND an event → create "[Prep task]" (todo, prep date) + "[Event]" (event date)
- Multiple deadlines for same event → one item per deadline
- Example: "Sofia's quinceañera April 10, need to RSVP by March 20 and buy dress by April 1" →
  Item 1: title "RSVP — Sofia's Quinceañera", date March 20, board event, status rsvp-needed
  Item 2: title "Buy dress — Sofia's Quinceañera", date April 1, board task, status todo
  Item 3: title "Sofia's Quinceañera", date April 10, board event, status accepted

For "add" or "multi", each item has:
- title: clear short title (max 60 chars). Do NOT include time or date in the title. For milestone items, format as "[Milestone] — [Event name]".
- date: YYYY-MM-DD. RULES: "today" → ${todayISO}. "tomorrow" → ${tomorrowISO}. For other relative terms (this Friday, next week, etc.) calculate from ${todayISO}. ALWAYS resolve — never return null if any day or date is mentioned.
- time: time string like "4:00 PM" if mentioned, otherwise null. ALWAYS capture times like "4pm", "4:00pm", "at 4", "noon", "3:30".
- notes: location, details, context. If a time was parsed, include it here too as "⏰ [time]". Otherwise null.
- board: event | study | activity | career | task. For prep/shopping tasks use "task", for the event itself use "event".
- status: for event use "rsvp-needed" unless already confirmed (then "accepted"). For tasks/prep use "todo". If message says "accepted" or "going" use "accepted". If "declined" use "declined".
- checklist: array of strings for any sub-tasks or to-do items. Recognize ALL of these triggers (case-insensitive): "to do:", "todo:", "checklist:", "checklist item:", "check:", "tasks:", "steps:", "don't forget:", "dont forget:", "remember to:", "remember:", "also need to:", "need to:", "needs to:", "pick up:", "bring:", "pack:", "grab:", "get:", "buy:", "items:", "list:", or any phrase that introduces a list of things to do or bring. Also recognize single items after these triggers, not just lists. E.g. "To do: Wear blue polo, bring camera" → ["Wear blue polo", "bring camera"]. "Remember to bring snacks" → ["Bring snacks"]. "Don't forget: permission slip" → ["Permission slip"]. Otherwise [].
- urgent: true if message uses "urgent", "ASAP", "don't forget", "important", otherwise false

For "update": { search: "keywords to find item", changes: { only changed fields } }
For "delete": { search: "keywords to find item" }
For "complete": { search: "keywords to find item" }

Message: "${messageBody}"

Return JSON:
- Single: { "action": "add", "items": [{...}] }
- Multiple: { "action": "multi", "items": [{...}, {...}] }
- Update: { "action": "update", "update": { "search": "...", "changes": {...} } }
- Delete: { "action": "delete", "delete": { "search": "..." } }
- Complete: { "action": "complete", "complete": { "search": "..." } }`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    console.log('[SMS] Raw AI response:', text)
    const clean = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
    aiResult = JSON.parse(clean)
    console.log('[SMS] Parsed result:', JSON.stringify(aiResult))
  } catch (err) {
    console.error('[SMS] AI parse FAILED — using fallback. Error:', err)
    console.log('[SMS] Message was:', messageBody)
    aiResult = {
      action: 'add',
      items: [{
        title: messageBody.slice(0, 60).trim(),
        date: null,
        time: null,
        notes: messageBody.length > 60 ? messageBody.slice(60).trim() : null,
        board: guessBoard(messageBody),
        status: 'todo',
        checklist: [],
        urgent: false,
      }]
    }
  }

  if (!aiResult) {
    return twimlResponse("Sorry, I couldn't understand that. Try: \"Emma's soccer game Friday at 4pm\" or \"Pick up: milk, eggs, bread\"")
  }

  // ── ADD / MULTI ───────────────────────────────────────────────
  if (aiResult.action === 'add' || aiResult.action === 'multi') {
    const items = aiResult.items ?? []
    if (items.length === 0) {
      return twimlResponse("I couldn't find any items to add. Try: \"dentist Thursday at 2pm\"")
    }

    const inserted: (ParsedItem & { board: string })[] = []

    for (const item of items) {
      const board = item.board ?? guessBoard(messageBody)
      const noteParts = [
        item.time ? `⏰ ${item.time}` : null,
        item.urgent ? '⚡ Urgent' : null,
        item.notes ?? null,
      ].filter(Boolean)
      const notes = noteParts.length > 0 ? noteParts.join(' · ') : null

      const checklist = (item.checklist ?? []).map((text: string, i: number) => ({
        id: `sms-${Date.now()}-${i}`,
        text,
        done: false,
      }))

      const { error } = await supabaseAdmin.from('items').insert({
        user_id: userId,
        title: item.title,
        date: item.date ?? null,
        notes,
        board,
        status: item.status ?? BOARD_STATUSES[board] ?? 'todo',
        checklist,
      })

      if (!error) inserted.push({ ...item, board })
    }

    if (inserted.length === 0) {
      return twimlResponse('Sorry, something went wrong saving your items. Please try again.')
    }

    if (inserted.length === 1) {
      const item = inserted[0]
      const dateStr = item.date ? ` · ${formatDateForReply(item.date)}` : ''
      const timeStr = item.time ? ` at ${item.time}` : ''
      const checkStr = item.checklist?.length > 0 ? ` · ${item.checklist.length} tasks` : ''
      const urgentStr = item.urgent ? ' ⚡' : ''
      return twimlResponse(`✅ Added to ${BOARD_NAMES[item.board]}: "${item.title}"${dateStr}${timeStr}${checkStr}${urgentStr}`)
    }

    const lines = inserted.map(item => {
      const dateStr = item.date ? ` (${formatDateForReply(item.date)})` : ''
      return `• ${item.title}${dateStr} → ${BOARD_NAMES[item.board]}`
    }).join('\n')
    return twimlResponse(`✅ Added ${inserted.length} items:\n${lines}`)
  }

  // ── COMPLETE ──────────────────────────────────────────────────
  if (aiResult.action === 'complete') {
    const search = aiResult.complete?.search
    if (!search) return twimlResponse("I couldn't find which item to mark complete.")

    const { data: found } = await supabaseAdmin
      .from('items')
      .select('id, title')
      .eq('user_id', userId)
      .ilike('title', `%${search}%`)
      .limit(1)
      .single()

    if (!found) return twimlResponse(`Couldn't find an item matching "${search}". Check your dashboard.`)

    await supabaseAdmin.from('items').update({ status: 'done' }).eq('id', found.id)
    return twimlResponse(`✅ Marked done: "${found.title}"`)
  }

  // ── DELETE ────────────────────────────────────────────────────
  if (aiResult.action === 'delete') {
    const search = aiResult.delete?.search
    if (!search) return twimlResponse("I couldn't find which item to delete.")

    const { data: found } = await supabaseAdmin
      .from('items')
      .select('id, title')
      .eq('user_id', userId)
      .ilike('title', `%${search}%`)
      .limit(1)
      .single()

    if (!found) return twimlResponse(`Couldn't find an item matching "${search}". Check your dashboard.`)

    await supabaseAdmin.from('items').delete().eq('id', found.id)
    return twimlResponse(`🗑️ Deleted: "${found.title}"`)
  }

  // ── UPDATE ────────────────────────────────────────────────────
  if (aiResult.action === 'update') {
    const search = aiResult.update?.search
    const changes = aiResult.update?.changes
    if (!search || !changes) return twimlResponse("I couldn't understand what to update.")

    const { data: found } = await supabaseAdmin
      .from('items')
      .select('id, title')
      .eq('user_id', userId)
      .ilike('title', `%${search}%`)
      .limit(1)
      .single()

    if (!found) return twimlResponse(`Couldn't find an item matching "${search}". Check your dashboard.`)

    const updates: Record<string, unknown> = {}
    if (changes.title) updates.title = changes.title
    if (changes.date !== undefined) updates.date = changes.date
    if (changes.notes !== undefined) updates.notes = changes.notes
    if (changes.status) updates.status = changes.status
    if (changes.board) updates.board = changes.board

    await supabaseAdmin.from('items').update(updates).eq('id', found.id)

    const dateStr = changes.date ? ` · ${formatDateForReply(changes.date)}` : ''
    return twimlResponse(`✏️ Updated: "${found.title}"${dateStr}`)
  }

  return twimlResponse("I didn't understand that. Try: \"Soccer game Friday 4pm\", \"Mark homework done\", or \"Delete dentist appointment\"")
}

function twimlResponse(message: string) {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}

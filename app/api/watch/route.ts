/**
 * Clarityboards — Watch API
 * File: app/api/watch/route.ts
 *
 * GET    /api/watch              → list all watches for user
 * POST   /api/watch?action=create → create a new watch
 * POST   /api/watch?action=check  → manually trigger a check (for testing)
 * DELETE /api/watch?id=xxx        → delete a watch
 * PATCH  /api/watch?id=xxx        → pause/resume a watch
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getSessionUser() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── Extract price or content from a URL using Claude ─────────────────────────
export async function extractFromUrl(url: string, watchType: string): Promise<{ value: number | null; text: string }> {
  let html = ''
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })
    html = await res.text()
  } catch {
    throw new Error('Could not fetch that URL. Make sure it is publicly accessible.')
  }

  // Strip scripts/styles, keep readable text
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 6000)

  const client = new Anthropic()

  if (watchType === 'price') {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Find the main price on this webpage. Return ONLY a JSON object like {"price": 299.99, "currency": "USD", "label": "Economy from MIA"} or {"price": null} if no price found. No markdown, no explanation.

Webpage text:
${text}`
      }]
    })
    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      return { value: parsed.price ?? null, text: parsed.label ?? '' }
    } catch {
      return { value: null, text: '' }
    }
  }

  if (watchType === 'availability') {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Is there any appointment, slot, seat, ticket, or availability shown on this page? Return ONLY JSON like {"available": true, "text": "3 slots available Thursday"} or {"available": false, "text": "No availability"}. No markdown.

Webpage text:
${text}`
      }]
    })
    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      return { value: parsed.available ? 1 : 0, text: parsed.text ?? '' }
    } catch {
      return { value: 0, text: '' }
    }
  }

  // 'change' type — just snapshot the meaningful text
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `Summarize the most important/current information on this page in 1-2 sentences. Return ONLY JSON like {"text": "summary here"}. No markdown.

Webpage text:
${text}`
    }]
  })
  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return { value: null, text: parsed.text ?? '' }
  } catch {
    return { value: null, text: '' }
  }
}

// ── Check if alert should fire ────────────────────────────────────────────────
function shouldAlert(watch: any, newValue: number | null, newText: string): boolean {
  if (watch.watch_type === 'price') {
    if (newValue === null) return false
    if (watch.target_value !== null && newValue <= watch.target_value) return true
    // Also alert if price dropped significantly (>10%) from last seen
    if (watch.current_value !== null && newValue < watch.current_value * 0.9) return true
    return false
  }
  if (watch.watch_type === 'availability') {
    return newValue === 1 && watch.current_value !== 1
  }
  if (watch.watch_type === 'change') {
    return newText !== watch.current_text && watch.current_text !== null
  }
  return false
}

// ── GET: list watches ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data } = await adminSupabase
    .from('watches')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ watches: data ?? [] })
}

// ── POST: create or manually check ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') ?? 'create'

  if (action === 'create') {
    let body: any
    try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const { title, url, watch_type = 'price', target_value, board = 'event' } = body
    if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })
    if (!url?.trim()) return NextResponse.json({ error: 'url is required' }, { status: 400 })

    // Do an initial check to get starting value
    let initialValue: number | null = null
    let initialText = ''
    try {
      const result = await extractFromUrl(url, watch_type)
      initialValue = result.value
      initialText = result.text
    } catch { /* ignore initial check failure */ }

    const { data, error } = await adminSupabase
      .from('watches')
      .insert({
        user_id: user.id,
        title: title.trim(),
        url: url.trim(),
        watch_type,
        target_value: target_value ?? null,
        current_value: initialValue,
        current_text: initialText,
        board,
        last_checked: new Date().toISOString(),
        status: 'active',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ watch: data, current_value: initialValue, current_text: initialText }, { status: 201 })
  }

  if (action === 'check') {
    // Manual check — used from UI to test
    let body: any
    try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
    const { id } = body

    const { data: watch } = await adminSupabase.from('watches').select('*').eq('id', id).eq('user_id', user.id).single()
    if (!watch) return NextResponse.json({ error: 'Watch not found' }, { status: 404 })

    const { value, text } = await extractFromUrl(watch.url, watch.watch_type)
    const alert = shouldAlert(watch, value, text)

    await adminSupabase.from('watches').update({
      current_value: value ?? watch.current_value,
      current_text: text || watch.current_text,
      last_checked: new Date().toISOString(),
    }).eq('id', id)

    return NextResponse.json({ value, text, alert })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// ── PATCH: pause/resume ───────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await req.json()
  const { status } = body

  await adminSupabase.from('watches').update({ status }).eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}

// ── DELETE: remove watch ──────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await adminSupabase.from('watches').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}

/**
 * Clarityboards — Notification Log API
 * File: app/api/notifications/route.ts
 *
 * GET  /api/notifications           → fetch unread/undismissed notifications for current user
 * POST /api/notifications           → log a new notification (internal use, service role)
 * PATCH /api/notifications          → mark as read or dismiss (one or all)
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data } = await supabase.auth.getUser(token)
  return data.user ?? null
}

// ── GET: fetch inbox notifications ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('notification_log')
    .select('*')
    .eq('user_id', user.id)
    .is('dismissed_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notifications: data ?? [] })
}

// ── POST: log a new notification (called from other API routes) ──────────────
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { user_id, actor_id, actor_email, board, action, item_id, item_title, detail } = body

  if (!user_id || !board || !action || !item_title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error } = await supabase.from('notification_log').insert({
    user_id, actor_id, actor_email, board, action, item_id, item_title, detail
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// ── PATCH: read or dismiss ───────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action, id } = body // action: 'dismiss' | 'dismiss_all' | 'read_all', id?: string

  const now = new Date().toISOString()

  if (action === 'dismiss' && id) {
    await supabase
      .from('notification_log')
      .update({ dismissed_at: now })
      .eq('id', id)
      .eq('user_id', user.id)
  } else if (action === 'dismiss_all') {
    await supabase
      .from('notification_log')
      .update({ dismissed_at: now })
      .eq('user_id', user.id)
      .is('dismissed_at', null)
  } else if (action === 'read_all') {
    await supabase
      .from('notification_log')
      .update({ read_at: now })
      .eq('user_id', user.id)
      .is('read_at', null)
  }

  return NextResponse.json({ ok: true })
}

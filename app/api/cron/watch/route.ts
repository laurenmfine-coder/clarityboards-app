/**
 * Clarityboards — Watch Cron Job
 * File: app/api/cron/watch/route.ts
 *
 * Runs every hour. Checks all active watches, fires alerts when conditions met.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractFromUrl } from '../../watch/route'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: watches } = await adminSupabase
    .from('watches')
    .select('*')
    .eq('status', 'active')

  if (!watches?.length) return NextResponse.json({ checked: 0 })

  let alerted = 0
  let checked = 0

  for (const watch of watches) {
    try {
      const { value, text } = await extractFromUrl(watch.url, watch.watch_type)
      checked++

      const shouldFire = checkAlert(watch, value, text)

      await adminSupabase.from('watches').update({
        current_value: value ?? watch.current_value,
        current_text: text || watch.current_text,
        last_checked: new Date().toISOString(),
        ...(shouldFire ? { last_alerted: new Date().toISOString(), status: 'alerted' } : {}),
      }).eq('id', watch.id)

      if (shouldFire) {
        alerted++
        await fireAlert(watch, value, text)
      }
    } catch (err) {
      console.error(`[watch-cron] Error checking watch ${watch.id}:`, err)
    }
  }

  return NextResponse.json({ checked, alerted })
}

function checkAlert(watch: any, newValue: number | null, newText: string): boolean {
  if (watch.watch_type === 'price') {
    if (newValue === null) return false
    if (watch.target_value !== null && newValue <= watch.target_value) return true
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

async function fireAlert(watch: any, value: number | null, text: string) {
  // 1. Create a board item as the alert
  const alertTitle = watch.watch_type === 'price'
    ? `🔔 Price Alert: ${watch.title}${value ? ` — $${value}` : ''}`
    : watch.watch_type === 'availability'
    ? `🔔 Now Available: ${watch.title}`
    : `🔔 Update: ${watch.title}`

  const { data: item } = await adminSupabase.from('items').insert({
    user_id: watch.user_id,
    board: watch.board,
    title: alertTitle,
    notes: text || watch.url,
    status: 'todo',
    checklist: [],
    date: new Date().toISOString().split('T')[0],
  }).select().single()

  if (item) {
    await adminSupabase.from('watches').update({ alert_item_id: item.id }).eq('id', watch.id)
  }

  // 2. Send push notification if user has subscriptions
  const { data: subs } = await adminSupabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', watch.user_id)

  if (!subs?.length) return

  const payload = JSON.stringify({
    title: alertTitle,
    body: text || `Check it out → ${watch.url}`,
    url: `/dashboard`,
  })

  // Fire push via internal endpoint
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://clarityboards.com'}/api/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.CRON_SECRET}` },
    body: JSON.stringify({ user_id: watch.user_id, payload }),
  }).catch(() => {})
}

export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Runs every 6 hours via Vercel Cron ───────────────────────────────────────
// Loops all active ical_subscriptions and triggers an import for each user
// Authorization: must include Bearer CRON_SECRET header (Vercel sets this automatically)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all distinct users who have at least one subscription
  const { data: subs, error } = await supabaseAdmin
    .from('ical_subscriptions')
    .select('id, user_id, label, url')
    .order('user_id')

  if (error) {
    console.error('[cron/ical] fetch subs error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!subs || subs.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No subscriptions found' })
  }

  // Group by user_id so we make one import call per user (processes all their subs at once)
  const userIds = [...new Set(subs.map(s => s.user_id))]

  let totalImported = 0
  let errors = 0
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://clarityboards.com'

  for (const userId of userIds) {
    try {
      const res = await fetch(`${baseUrl}/api/ical-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
      const data = await res.json()
      if (data.totalImported) totalImported += data.totalImported
    } catch (err: any) {
      console.error(`[cron/ical] error for user ${userId}:`, err.message)
      errors++
    }
  }

  return NextResponse.json({
    processed: userIds.length,
    totalImported,
    errors,
    subscriptions: subs.length,
  })
}

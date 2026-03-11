export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().slice(0, 10)

  const { data: rules, error } = await supabase
    .from('recurring_rules')
    .select('id')
    .lte('next_due', today)

  if (error) {
    console.error('[cron/recur] fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!rules || rules.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  let processed = 0
  let errors = 0

  for (const rule of rules) {
    const { error: fnError } = await supabase.rpc('create_next_recurring_item', {
      rule_id: rule.id,
    })
    if (fnError) {
      console.error(`[cron/recur] error for rule ${rule.id}:`, fnError)
      errors++
    } else {
      processed++
    }
  }

  return NextResponse.json({ processed, errors, total: rules.length })
}

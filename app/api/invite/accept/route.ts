export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


// GET /api/invite/accept?token=xxx
// Called when user clicks invite link — validates token, returns share info
export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const { data: share, error } = await supabase
    .from('board_shares')
    .select('*')
    .eq('invite_token', token)
    .eq('status', 'pending')
    .single()

  if (error || !share) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  }

  return NextResponse.json({ share })
}

// POST /api/invite/accept
// Called after user signs in — activates the share for their account
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { token, user_id, user_email, user_phone } = await req.json()
    if (!token || !user_id) {
      return NextResponse.json({ error: 'Missing token or user_id' }, { status: 400 })
    }

    // Find the pending invite
    const { data: share, error: findError } = await supabase
      .from('board_shares')
      .select('*')
      .eq('invite_token', token)
      .eq('status', 'pending')
      .single()

    if (findError || !share) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
    }

    // Prevent accepting your own invite
    if (share.owner_id === user_id) {
      return NextResponse.json({ error: 'You cannot accept your own invite' }, { status: 400 })
    }

    // Activate the share
    const { error: updateError } = await supabase
      .from('board_shares')
      .update({
        shared_user_id: user_id,
        status: 'active',
        accepted_at: new Date().toISOString(),
        // Clear the pending invite identifiers
        invited_email: null,
        invited_phone: null,
      })
      .eq('id', share.id)

    if (updateError) {
      console.error('[accept] update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Also register their phone in profiles if they accepted via SMS
    if (user_phone && share.invited_phone) {
      await supabase
        .from('profiles')
        .upsert({ user_id, phone: user_phone }, { onConflict: 'user_id' })
    }

    return NextResponse.json({
      success: true,
      board_type: share.board_type,
      role: share.role,
      owner_id: share.owner_id,
    })
  } catch (err) {
    console.error('[accept] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

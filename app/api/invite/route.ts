export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://clarityboards-app.vercel.app'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { owner_id, board_type, invited_name, invite_method, invite_value, role } = await req.json()

    if (!owner_id || !board_type || !invited_name || !invite_method || !invite_value || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create the board_shares row
    const insertData: Record<string, string> = {
      owner_id,
      board_type,
      invited_name,
      role,
      status: 'pending',
    }
    if (invite_method === 'email') insertData.invited_email = invite_value.toLowerCase().trim()
    if (invite_method === 'sms')   insertData.invited_phone = invite_value.trim()

    const { data: share, error: insertError } = await supabase
      .from('board_shares')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('[invite] insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const acceptUrl = `${BASE_URL}/invite/accept?token=${share.invite_token}`

    // Get owner's name for the invite message
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', owner_id)
      .single()
    const ownerName = ownerProfile?.email?.split('@')[0] ?? 'Someone'

    const boardLabel = board_type.charAt(0).toUpperCase() + board_type.slice(1) + 'Board'
    const roleLabel  = role === 'editor' ? 'add and edit items' : 'view items'

    // Send invite
    if (invite_method === 'sms') {
      const sid   = process.env.TWILIO_ACCOUNT_SID!
      const token = process.env.TWILIO_AUTH_TOKEN!
      const from  = process.env.TWILIO_PHONE_NUMBER ?? '+18773189322'
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: from,
          To: invite_value.trim(),
          Body: `${ownerName} invited you to ${roleLabel} on their ${boardLabel} in Clarityboards! Tap to join: ${acceptUrl}`,
        }),
      })
    } else if (invite_method === 'email') {
      // Postmark
      await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'X-Postmark-Server-Token': process.env.POSTMARK_API_TOKEN!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          From: 'noreply@clarityboards.com',
          To: invite_value.trim(),
          Subject: `${ownerName} shared their ${boardLabel} with you`,
          HtmlBody: `
            <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px;">
              <h2 style="color: #1A2B3C;">You're invited to Clarityboards</h2>
              <p style="color: #5A7A94; font-size: 15px; line-height: 1.6;">
                <strong>${ownerName}</strong> has invited you to ${roleLabel} on their <strong>${boardLabel}</strong>.
              </p>
              <a href="${acceptUrl}" style="display:inline-block; margin-top: 20px; padding: 12px 28px; background: #2874A6; color: white; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: bold;">
                Accept invitation →
              </a>
              <p style="margin-top: 24px; color: #9B9B9B; font-size: 12px;">
                This link expires in 7 days. If you didn't expect this invite, you can ignore it.
              </p>
              <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #E8E4DF;">
                <p style="color: #9C8878; font-size: 12px; margin: 0 0 6px;">
                  Sent via <strong style="color: #1A1714;">Clarityboards</strong> — one place for your whole life.
                </p>
                <a href="${BASE_URL}?ref=invite" style="display: inline-block; padding: 8px 18px; background: #F5F2EE; color: #1A1714; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 600; border: 1px solid #E8E4DF;">
                  Try Clarityboards free →
                </a>
              </div>
            </div>
          `,
          TextBody: `${ownerName} invited you to ${roleLabel} on their ${boardLabel} in Clarityboards. Accept here: ${acceptUrl}\n\n---\nTry Clarityboards free: ${BASE_URL}?ref=invite`,
          MessageStream: 'outbound',
        }),
      })
    }

    return NextResponse.json({ success: true, share_id: share.id })
  } catch (err) {
    console.error('[invite] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

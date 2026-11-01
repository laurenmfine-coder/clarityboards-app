export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { handleChoreBank } from '@/lib/chorebank/server'

// Chore Bank API: kids check off chores, parent approves, balances and interest.
export async function POST(req: NextRequest) {
  let body: any = {}
  try { body = await req.json() } catch {}
  const { status, json } = await handleChoreBank(body, req.headers.get('authorization'))
  return NextResponse.json(json, { status, headers: { 'Cache-Control': 'no-store' } })
}

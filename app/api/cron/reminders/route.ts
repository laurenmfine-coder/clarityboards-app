import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const res = await fetch(
      'https://lgyieelkeosuiruaxyah.supabase.co/functions/v1/send-reminders',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneWllZWxrZW9zdWlydWF4eWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwOTk1NTcsImV4cCI6MjA4ODY3NTU1N30.lT2UhnMepDIPkBu1u40a4h9-KyaEaPcIiRxB7-vauk8`,
        },
      }
    )
    const data = await res.json()
    return NextResponse.json({ ok: true, ...data })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

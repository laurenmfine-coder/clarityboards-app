/**
 * Clarityboards — TravelBoard API
 * File: app/api/travel/route.ts
 *
 * GET    /api/travel?action=trips               — list user's trips
 * POST   /api/travel?action=trip                — create trip
 * PATCH  /api/travel?action=trip&id=...         — update trip
 * DELETE /api/travel?action=trip&id=...         — delete trip
 *
 * GET    /api/travel?action=places&tripId=...   — list place cards for a trip
 * POST   /api/travel?action=place               — create place card
 * PATCH  /api/travel?action=place&id=...        — update place card
 * DELETE /api/travel?action=place&id=...        — delete place card
 *
 * GET    /api/travel?action=packing&tripId=...  — list packing items
 * POST   /api/travel?action=packing             — create packing item
 * PATCH  /api/travel?action=packing&id=...      — update packing item
 * DELETE /api/travel?action=packing&id=...      — delete packing item
 *
 * POST   /api/travel?action=fetch-place         — fetch OG image + title from URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function getSupabase(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}
  )
}

async function fetchPlaceData(url: string): Promise<{ title: string | null; image: string | null; address: string | null }> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html' },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    })
    const html = await res.text()

    const og = (prop: string) => {
      const patterns = [
        new RegExp(`property=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i'),
        new RegExp(`content=["']([^"']+)["'][^>]*property=["']${prop}["']`, 'i'),
      ]
      for (const p of patterns) { const m = html.match(p); if (m?.[1]) return m[1].trim() }
      return null
    }

    const image = og('og:image:secure_url') ?? og('og:image') ??
      (() => { const m = html.match(/name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i); return m?.[1] ?? null })()
    const title = og('og:title') ?? (() => { const m = html.match(/<title[^>]*>([^<|–]+)/i); return m?.[1]?.trim() ?? null })()
    const address = og('place:location:city') ?? og('og:locality') ?? null

    return {
      title: title?.replace(/\s*[\|–—-]\s*[^|–—-]{3,40}$/, '').trim() ?? null,
      image: image?.startsWith('http') ? image : image ? new URL(image, url).href : null,
      address,
    }
  } catch {
    return { title: null, image: null, address: null }
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const supabase = getSupabase(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (action === 'trips') {
    const { data, error } = await supabase.from('trips').select('*').eq('user_id', user.id).order('start_date', { ascending: true, nullsFirst: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ trips: data })
  }

  if (action === 'places') {
    const tripId = searchParams.get('tripId')
    if (!tripId) return NextResponse.json({ error: 'tripId required' }, { status: 400 })
    const { data, error } = await supabase.from('place_cards').select('*').eq('trip_id', tripId).eq('user_id', user.id).order('day_number', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ places: data })
  }

  if (action === 'packing') {
    const tripId = searchParams.get('tripId')
    if (!tripId) return NextResponse.json({ error: 'tripId required' }, { status: 400 })
    const { data, error } = await supabase.from('packing_items').select('*').eq('trip_id', tripId).eq('user_id', user.id).order('category').order('created_at')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ items: data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const supabase = getSupabase(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  if (action === 'fetch-place') {
    const { url } = body
    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })
    const data = await fetchPlaceData(url)
    return NextResponse.json(data)
  }

  if (action === 'trip') {
    const { data, error } = await supabase.from('trips').insert({ ...body, user_id: user.id }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ trip: data })
  }

  if (action === 'place') {
    // Auto-fetch cover image if URL provided and no image given
    if (body.url && !body.cover_image) {
      const og = await fetchPlaceData(body.url)
      if (og.image) body.cover_image = og.image
      if (!body.title && og.title) body.title = og.title
      if (!body.address && og.address) body.address = og.address
    }
    const { data, error } = await supabase.from('place_cards').insert({ ...body, user_id: user.id }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ place: data })
  }

  if (action === 'packing') {
    const { data, error } = await supabase.from('packing_items').insert({ ...body, user_id: user.id }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const id = searchParams.get('id')
  const supabase = getSupabase(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const body = await req.json()

  const table = action === 'trip' ? 'trips' : action === 'place' ? 'place_cards' : action === 'packing' ? 'packing_items' : null
  if (!table) return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  const { data, error } = await supabase.from(table).update(body).eq('id', id).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const id = searchParams.get('id')
  const supabase = getSupabase(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const table = action === 'trip' ? 'trips' : action === 'place' ? 'place_cards' : action === 'packing' ? 'packing_items' : null
  if (!table) return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

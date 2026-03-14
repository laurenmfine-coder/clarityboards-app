/**
 * Clarityboards — WishlistBoard API
 * File: app/api/wishlist/route.ts
 *
 * GET    /api/wishlist?action=lists              — user's wishlists
 * POST   /api/wishlist?action=list               — create list
 * PATCH  /api/wishlist?action=list&id=...        — update list
 * DELETE /api/wishlist?action=list&id=...        — delete list
 *
 * GET    /api/wishlist?action=items&listId=...   — items in a list
 * POST   /api/wishlist?action=item               — add item (auto-fetches OG)
 * PATCH  /api/wishlist?action=item&id=...        — update item
 * DELETE /api/wishlist?action=item&id=...        — delete item
 *
 * POST   /api/wishlist?action=fetch-product      — fetch OG image+price from URL
 * POST   /api/wishlist?action=share&id=...       — toggle public sharing
 * GET    /api/wishlist?action=by-token&token=... — public view by share token
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getUserSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return { user: null, supabase: adminSupabase, token }
  const sb = getUserSupabase(token)
  const { data: { user } } = await sb.auth.getUser()
  return { user, supabase: sb, token }
}

// ── Fetch product data from any retail URL ─────────────────
async function fetchProductData(url: string): Promise<{
  title: string | null; image: string | null;
  price: number | null; currency: string; description: string | null;
}> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    })
    const html = await res.text()

    // OG image
    const imgPatterns = [
      /property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*property=["']og:image:secure_url["']/i,
      /property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      /name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    ]
    let image: string | null = null
    for (const p of imgPatterns) {
      const m = html.match(p)
      if (m?.[1]) { image = m[1].startsWith('http') ? m[1] : new URL(m[1], url).href; break }
    }

    // OG title
    const titlePatterns = [
      /property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*property=["']og:title["']/i,
      /<title[^>]*>([^<|–]+)/i,
    ]
    let title: string | null = null
    for (const p of titlePatterns) {
      const m = html.match(p)
      if (m?.[1]) { title = m[1].trim().replace(/\s*[\|–—-]\s*[^|–—-]{3,40}$/, '').trim(); break }
    }

    // OG description
    const descMatch = html.match(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
      ?? html.match(/content=["']([^"']+)["'][^>]*property=["']og:description["']/i)
    const description = descMatch?.[1]?.trim() ?? null

    // Price — try common patterns first, then Claude as fallback
    let price: number | null = null
    let currency = 'USD'

    // Common retail price patterns
    const pricePatterns = [
      /property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*property=["']product:price:amount["']/i,
      /"price"\s*:\s*"?([\d.]+)"?/,
      /"offers"\s*:.*?"price"\s*:\s*"?([\d.]+)"?/s,
      /data-price=["']([\d.]+)["']/i,
      /class=["'][^"']*price[^"']*["'][^>]*>\s*\$?\s*([\d,]+\.?\d*)/i,
    ]
    for (const p of pricePatterns) {
      const m = html.match(p)
      if (m?.[1]) {
        const parsed = parseFloat(m[1].replace(',', ''))
        if (!isNaN(parsed) && parsed > 0 && parsed < 100000) { price = parsed; break }
      }
    }

    // Currency
    const currencyMatch = html.match(/property=["']product:price:currency["'][^>]*content=["']([^"']+)["']/i)
    if (currencyMatch?.[1]) currency = currencyMatch[1]

    // If no price found, use Claude as fallback (only for short HTML)
    if (price === null) {
      try {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000)
        const msg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 128,
          messages: [{ role: 'user', content: `Find the sale price or regular price of the main product on this page. Return ONLY JSON: {"price": 59.99} or {"price": null}. No markdown.\n\n${text}` }]
        })
        const raw = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
        if (parsed.price) price = parsed.price
      } catch {}
    }

    return { title, image, price, currency, description }
  } catch {
    return { title: null, image: null, price: null, currency: 'USD', description: null }
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  // Public route — no auth needed
  if (action === 'by-token') {
    const token = searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })
    const { data: list } = await adminSupabase
      .from('wishlists').select('*').eq('share_token', token).eq('is_public', true).single()
    if (!list) return NextResponse.json({ error: 'List not found or not public' }, { status: 404 })
    const { data: items } = await adminSupabase
      .from('wish_items').select('*').eq('wishlist_id', list.id).order('created_at')
    return NextResponse.json({ list, items: items ?? [] })
  }

  const { user, supabase } = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (action === 'lists') {
    const { data } = await supabase.from('wishlists').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    return NextResponse.json({ lists: data ?? [] })
  }

  if (action === 'items') {
    const listId = searchParams.get('listId')
    if (!listId) return NextResponse.json({ error: 'listId required' }, { status: 400 })
    const { data } = await supabase.from('wish_items').select('*').eq('wishlist_id', listId).eq('user_id', user.id).order('created_at')
    return NextResponse.json({ items: data ?? [] })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const body = await req.json()

  if (action === 'fetch-product') {
    const { url } = body
    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })
    const data = await fetchProductData(url)
    return NextResponse.json(data)
  }

  const { user, supabase } = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (action === 'list') {
    const { data, error } = await supabase.from('wishlists').insert({ ...body, user_id: user.id }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ list: data })
  }

  if (action === 'item') {
    // Auto-fetch product data if URL provided
    let itemData = { ...body, user_id: user.id }
    if (body.url && !body.cover_image) {
      const product = await fetchProductData(body.url)
      if (product.image) itemData.cover_image = product.image
      if (!body.title && product.title) itemData.title = product.title
      if (!body.price && product.price) itemData.price = product.price
      if (!body.notes && product.description) itemData.notes = product.description.slice(0, 200)
    }
    const { data, error } = await supabase.from('wish_items').insert(itemData).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Auto-create a price watch if URL has a price
    if (data && data.url && data.price) {
      try {
        const watchRes = await supabase.from('watches').insert({
          user_id: user.id,
          title: data.title,
          url: data.url,
          watch_type: 'price',
          current_value: data.price,
          target_value: body.target_price ?? null,
          board: 'wishlist',
          status: 'active',
        }).select().single()
        if (watchRes.data) {
          await supabase.from('wish_items').update({ watch_id: watchRes.data.id, price_checked_at: new Date().toISOString() }).eq('id', data.id)
          data.watch_id = watchRes.data.id
        }
      } catch {}
    }

    return NextResponse.json({ item: data })
  }

  if (action === 'share') {
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const { is_public } = body
    const { data, error } = await supabase.from('wishlists').update({ is_public }).eq('id', id).eq('user_id', user.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ list: data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { user, supabase } = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const table = action === 'list' ? 'wishlists' : 'wish_items'
  const { data, error } = await supabase.from(table).update(body).eq('id', id).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { user, supabase } = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const table = action === 'list' ? 'wishlists' : 'wish_items'
  const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

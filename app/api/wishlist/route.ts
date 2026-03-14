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
// Strategy 1: Direct fetch with browser-like headers
// Strategy 2: JSON-LD structured data (works for many retailers)
// Strategy 3: Claude extraction from whatever HTML we get
// Strategy 4: Manual entry fallback (return what we got)
async function fetchProductData(url: string): Promise<{
  title: string | null; image: string | null;
  price: number | null; currency: string; description: string | null;
}> {
  const empty = { title: null, image: null, price: null, currency: 'USD', description: null }

  // Detect retailer for site-specific strategies
  const host = (() => { try { return new URL(url).hostname.replace('www.','') } catch { return '' } })()

  // Build headers that look like a real browser
  const headers: Record<string,string> = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
  }

  // Loft / Ann Taylor / WHBM use the same parent company (Ascena/Premium Apparel)
  // Their product data is in window.__PRELOADED_STATE__ JSON
  const isAscena = ['loft.com','anntaylor.com','whbm.com','whitehouseblackmarket.com'].includes(host)

  let html = ''
  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(12000),
      redirect: 'follow',
    })
    html = await res.text()
  } catch {
    return empty
  }

  let title: string | null = null
  let image: string | null = null
  let price: number | null = null
  let currency = 'USD'
  let description: string | null = null

  // ── Strategy 1: JSON-LD structured data ──────────────────
  // Most modern retailers embed Product schema as JSON-LD
  try {
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? []
    for (const block of jsonLdMatches) {
      const content = block.replace(/<script[^>]*>/i,'').replace(/<\/script>/i,'')
      try {
        const data = JSON.parse(content)
        const products = Array.isArray(data) ? data : [data]
        for (const item of products) {
          const product = item['@type']==='Product' ? item : item['@graph']?.find((n:any)=>n['@type']==='Product')
          if (!product) continue
          if (!title && product.name) title = product.name
          if (!description && product.description) description = String(product.description).slice(0,200)
          if (!image) {
            const img = product.image
            if (typeof img === 'string') image = img
            else if (Array.isArray(img) && img.length > 0) image = typeof img[0]==='string'?img[0]:img[0]?.url??null
            else if (img?.url) image = img.url
          }
          if (!price) {
            const offers = product.offers
            if (offers) {
              const offer = Array.isArray(offers) ? offers[0] : offers
              const p = parseFloat(offer?.price ?? offer?.lowPrice ?? '')
              if (!isNaN(p) && p > 0) { price = p; currency = offer?.priceCurrency ?? 'USD' }
            }
          }
          if (title) break
        }
      } catch {}
    }
  } catch {}

  // ── Strategy 2: Ascena/Loft preloaded state ───────────────
  if (isAscena && (!title || !price)) {
    try {
      // Loft embeds product data in a preloaded state object
      const stateMatch = html.match(/window\.__PRELOADED_STATE__\s*=\s*(\{[\s\S]{0,50000}?\});?\s*<\/script>/i)
        ?? html.match(/"product"\s*:\s*\{[^}]{0,2000}"name"\s*:\s*"([^"]+)"/)
      if (stateMatch) {
        // Extract name directly if full parse fails
        const nameM = html.match(/"displayName"\s*:\s*"([^"]+)"/) ?? html.match(/"productName"\s*:\s*"([^"]+)"/) ?? html.match(/"name"\s*:\s*"([^"]{5,80})"/)
        if (nameM?.[1] && !title) title = nameM[1]
        const priceM = html.match(/"salePrice"\s*:\s*([\d.]+)/) ?? html.match(/"listPrice"\s*:\s*([\d.]+)/) ?? html.match(/"price"\s*:\s*([\d.]+)/)
        if (priceM?.[1] && !price) { const p = parseFloat(priceM[1]); if(p>0&&p<100000) price = p; }
      }
      // Loft product images are usually in og:image even when JS-heavy
      if (!image) {
        const imgM = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
               ?? html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
        if (imgM?.[1]) image = imgM[1]
      }
    } catch {}
  }

  // ── Strategy 3: Standard OG meta tags ────────────────────
  if (!title) {
    const m = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
           ?? html.match(/content=["']([^"']+)["'][^>]*property=["']og:title["']/i)
           ?? html.match(/<title[^>]*>([^<|–]+)/i)
    if (m?.[1]) title = m[1].trim().replace(/\s*[\|–—-]\s*[^|–—-]{3,40}$/, '').trim()
  }
  if (!image) {
    const patterns = [
      /property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*property=["']og:image:secure_url["']/i,
      /property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      /name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    ]
    for (const p of patterns) { const m = html.match(p); if (m?.[1]) { image = m[1].startsWith('http')?m[1]:new URL(m[1],url).href; break } }
  }
  if (!description) {
    const m = html.match(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
           ?? html.match(/content=["']([^"']+)["'][^>]*property=["']og:description["']/i)
    if (m?.[1]) description = m[1].trim()
  }
  if (!price) {
    const pricePatterns = [
      /property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*property=["']product:price:amount["']/i,
      /"price"\s*:\s*"?([\d.]+)"?/,
      /"offers"[\s\S]*?"price"\s*:\s*"?([\d.]+)"?/,
      /data-price=["']([\d.]+)["']/i,
    ]
    for (const p of pricePatterns) {
      const m = html.match(p)
      if (m?.[1]) { const n = parseFloat(m[1].replace(',','')); if(!isNaN(n)&&n>0&&n<100000){price=n;break} }
    }
    const currM = html.match(/property=["']product:price:currency["'][^>]*content=["']([^"']+)["']/i)
    if (currM?.[1]) currency = currM[1]
  }

  // ── Strategy 4: Claude extraction from stripped HTML ──────
  // Only use if we're missing both title and price (avoid unnecessary API calls)
  if ((!title || !price) && html.length > 100) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const text = html.replace(/<script[\s\S]*?<\/script>/gi,'')
                       .replace(/<style[\s\S]*?<\/style>/gi,'')
                       .replace(/<[^>]+>/g,' ')
                       .replace(/\s+/g,' ')
                       .trim()
                       .slice(0, 4000)
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: `Extract product info from this retail page. Return ONLY JSON, no markdown:
{"title":"exact product name or null","price":59.99,"image_url":"https://... or null"}
If no product found, return {"title":null,"price":null,"image_url":null}

Page text:
${text}` }]
      })
      const raw = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
      const parsed = JSON.parse(raw.replace(/```json|```/g,'').trim())
      if (!title && parsed.title) title = parsed.title
      if (!price && parsed.price) { const p = parseFloat(parsed.price); if(!isNaN(p)&&p>0) price=p }
      if (!image && parsed.image_url) image = parsed.image_url
    } catch {}
  }

  return { title, image, price, currency, description }
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

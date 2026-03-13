/**
 * Clarityboards — Pinterest Board RSS Reader (v2)
 * File: app/api/pinterest-rss/route.ts
 *
 * Strategy:
 * 1. Fetch board RSS → get list of pin URLs
 * 2. For each pin, fetch the pin page → extract outbound recipe URL
 * 3. Fetch the recipe source page → extract og:image + og:title
 * Result: clean recipe titles + high-quality photos from source sites
 */

import { NextRequest, NextResponse } from 'next/server'

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface PinSuggestion {
  pinId:     string
  title:     string
  pinUrl:    string
  recipeUrl: string | null
  image:     string | null
  source:    string | null
}

// ── Step 1: board URL → RSS URL ───────────────────────────
function toRssUrl(boardUrl: string): string {
  const clean = boardUrl.replace(/\/$/, '').split('?')[0]
  return clean.endsWith('.rss') ? clean : clean + '.rss'
}

// ── Step 2: parse RSS → raw pin list ─────────────────────
function parseRss(xml: string): Array<{ pinId: string; pinUrl: string; rssTitle: string }> {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) ?? []
  return items.slice(0, 12).map((item, idx) => {
    // title from CDATA or plain text
    const titleMatch = item.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)
      ?? item.match(/<title[^>]*>([^<]+)<\/title>/i)
    const rssTitle = titleMatch?.[1]?.trim() ?? ''

    // pin URL from <link> or <guid>
    const linkMatch = item.match(/<link>([^<]+)<\/link>/i)
    const guidMatch = item.match(/<guid[^>]*>([^<]+)<\/guid>/i)
    const pinUrl = linkMatch?.[1]?.trim() ?? guidMatch?.[1]?.trim() ?? ''
    const pinId = pinUrl.split('/').filter(Boolean).pop() ?? String(idx)

    return { pinId, pinUrl, rssTitle }
  })
}

// ── Step 3: fetch pin page → extract outbound recipe URL ──
async function getRecipeUrlFromPin(pinUrl: string): Promise<string | null> {
  if (!pinUrl.includes('pinterest.com')) return null
  try {
    const res = await fetch(pinUrl, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html' },
      signal: AbortSignal.timeout(7000),
      redirect: 'follow',
    })
    const html = await res.text()

    // Pinterest embeds the source URL in JSON data on the pin page
    const patterns = [
      // JSON-LD / next data source link
      /"link"\s*:\s*"(https?:\/\/(?!(?:www\.)?pinterest)[^"\\]+)"/,
      /"url"\s*:\s*"(https?:\/\/(?!(?:www\.)?pinterest)[^"\\]+)"/,
      /"articleUrl"\s*:\s*"(https?:\/\/[^"\\]+)"/,
      // og:see_also
      /property=["']og:see_also["'][^>]*content=["'](https?:\/\/[^"']+)["']/i,
      // any external href in the page
      /href=["'](https?:\/\/(?!(?:www\.)?pinterest)[^"']+)["'][^>]*data-test=["']pin-closeup-link["']/i,
    ]

    for (const p of patterns) {
      const m = html.match(p)
      if (m?.[1]) {
        const url = m[1].replace(/\\/g, '')
        if (!url.includes('pinterest') && url.startsWith('http')) return url
      }
    }
  } catch {}
  return null
}

// ── Step 4: fetch recipe page → og:image + og:title ──────
async function getOgData(url: string): Promise<{ title: string | null; image: string | null }> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html' },
      signal: AbortSignal.timeout(7000),
      redirect: 'follow',
    })
    const html = await res.text()

    const imagePatterns = [
      /property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*property=["']og:image:secure_url["']/i,
      /property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      /name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
    ]
    let image: string | null = null
    for (const p of imagePatterns) {
      const m = html.match(p)
      if (m?.[1]) {
        image = m[1].startsWith('http') ? m[1] : new URL(m[1], url).href
        break
      }
    }

    const titlePatterns = [
      /property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*property=["']og:title["']/i,
      /<title[^>]*>([^<|]+)/i,
    ]
    let title: string | null = null
    for (const p of titlePatterns) {
      const m = html.match(p)
      if (m?.[1]) { title = m[1].trim(); break }
    }

    return { title, image }
  } catch {
    return { title: null, image: null }
  }
}

// ── Enrich one pin: pin page → recipe URL → og data ───────
async function enrichPin(raw: { pinId: string; pinUrl: string; rssTitle: string }): Promise<PinSuggestion> {
  const recipeUrl = await getRecipeUrlFromPin(raw.pinUrl)

  let title = raw.rssTitle
  let image: string | null = null
  let source: string | null = null

  if (recipeUrl) {
    source = new URL(recipeUrl).hostname.replace('www.', '')
    const og = await getOgData(recipeUrl)
    if (og.title) title = og.title
    if (og.image) image = og.image
  }

  // Clean up title — strip site name suffixes like " | Serious Eats"
  title = title.replace(/\s*[\|–—-]\s*[^|–—-]{3,40}$/, '').trim() || raw.rssTitle

  return { pinId: raw.pinId, pinUrl: raw.pinUrl, recipeUrl, title, image, source }
}

// ── Main handler ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const boardUrl = searchParams.get('boardUrl')
  if (!boardUrl) return NextResponse.json({ error: 'boardUrl required', pins: [] }, { status: 400 })

  const rssUrl = toRssUrl(boardUrl)

  try {
    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': UA, 'Accept': 'application/rss+xml, application/xml, text/xml' },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Board not found or private (${res.status})`, pins: [] })
    }

    const xml = await res.text()
    if (!xml.includes('<item>')) {
      return NextResponse.json({ error: 'No pins found — board may be empty or private', pins: [] })
    }

    const rawPins = parseRss(xml)

    // Enrich pins in parallel batches of 4 (avoid overwhelming source sites)
    const enriched: PinSuggestion[] = []
    for (let i = 0; i < Math.min(rawPins.length, 8); i += 4) {
      const batch = await Promise.all(rawPins.slice(i, i + 4).map(enrichPin))
      enriched.push(...batch)
    }

    // Filter out pins where we couldn't get a recipe URL at all
    const valid = enriched.filter(p => p.recipeUrl || p.title)

    return NextResponse.json({ pins: valid, total: rawPins.length })
  } catch {
    return NextResponse.json({ error: 'Could not fetch board RSS', pins: [] })
  }
}

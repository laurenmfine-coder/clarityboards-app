/**
 * Clarityboards — Pinterest Board RSS Reader
 * File: app/api/pinterest-rss/route.ts
 *
 * GET /api/pinterest-rss?boardUrl=https://pinterest.com/username/boardname
 *
 * Fetches a public Pinterest board's RSS feed (no API key needed),
 * parses pins, fetches OG images from the outbound recipe URLs,
 * and returns them as meal suggestions.
 */

import { NextRequest, NextResponse } from 'next/server'

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface PinSuggestion {
  pinId:      string
  title:      string
  pinUrl:     string
  recipeUrl:  string | null
  image:      string | null
  description: string | null
  source:     string | null
}

function boardUrlToRss(boardUrl: string): string {
  // https://pinterest.com/username/boardname → https://pinterest.com/username/boardname.rss
  const clean = boardUrl.replace(/\/$/, '')
  return clean.endsWith('.rss') ? clean : clean + '.rss'
}

function extractTag(xml: string, tag: string): string | null {
  const patterns = [
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'),
    new RegExp(`<${tag}[^>]*>([^<]+)<\\/${tag}>`, 'i'),
  ]
  for (const p of patterns) {
    const m = xml.match(p)
    if (m?.[1]) return m[1].trim()
  }
  return null
}

function extractAttr(xml: string, tag: string, attr: string): string | null {
  const pattern = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*>`, 'i')
  const m = xml.match(pattern)
  return m?.[1] ?? null
}

function extractImage(itemXml: string): string | null {
  // Pinterest puts images in <media:content> or <enclosure> or in description img tags
  const patterns = [
    /media:content[^>]*url=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i,
    /enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/i,
    /<img[^>]*src=["']([^"']+)["']/i,
  ]
  for (const p of patterns) {
    const m = itemXml.match(p)
    if (m?.[1]) return m[1]
  }
  return null
}

function extractOutboundUrl(itemXml: string): string | null {
  // Pinterest RSS items often have the source link in <link> or in description href
  const linkMatch = itemXml.match(/<link>([^<]+)<\/link>/i)
  if (linkMatch?.[1] && !linkMatch[1].includes('pinterest.com/pin/')) {
    return linkMatch[1].trim()
  }

  // Try href in description that points away from pinterest
  const hrefMatches = itemXml.matchAll(/href=["'](https?:\/\/(?!(?:www\.)?pinterest)[^"']+)["']/gi)
  for (const m of hrefMatches) {
    if (m[1] && !m[1].includes('pinterest')) return m[1]
  }
  return null
}

function parsePinterestRss(xml: string): PinSuggestion[] {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) ?? []
  return items.slice(0, 20).map((itemXml, idx) => {
    const title = extractTag(itemXml, 'title') ?? 'Recipe'
    const pinUrl = extractTag(itemXml, 'link') ?? ''
    const description = extractTag(itemXml, 'description') ?? null
    const image = extractImage(itemXml)
    const recipeUrl = extractOutboundUrl(itemXml)
    const guidMatch = itemXml.match(/<guid[^>]*>([^<]+)<\/guid>/i)
    const pinId = guidMatch?.[1]?.split('/').filter(Boolean).pop() ?? String(idx)
    const source = recipeUrl ? new URL(recipeUrl).hostname.replace('www.', '') : null

    return { pinId, title, pinUrl, recipeUrl, image, description, source }
  })
}

async function enrichWithOgImage(pin: PinSuggestion): Promise<PinSuggestion> {
  // If the pin has a recipe URL, fetch the OG image from the source site
  if (pin.recipeUrl) {
    try {
      const res = await fetch(pin.recipeUrl, {
        headers: { 'User-Agent': UA, 'Accept': 'text/html' },
        signal: AbortSignal.timeout(6000),
        redirect: 'follow',
      })
      const html = await res.text()

      const imagePatterns = [
        /property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["']/i,
        /property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
        /name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
        /content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      ]
      for (const p of imagePatterns) {
        const m = html.match(p)
        if (m?.[1]) {
          pin.image = m[1].startsWith('http') ? m[1] : new URL(m[1], pin.recipeUrl!).href
          break
        }
      }

      // Also try to get a cleaner title from the recipe page
      const titleMatch = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
        ?? html.match(/content=["']([^"']+)["'][^>]*property=["']og:title["']/i)
      if (titleMatch?.[1]) pin.title = titleMatch[1].trim()
    } catch {
      // Keep whatever we had from RSS
    }
  }
  return pin
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const boardUrl = searchParams.get('boardUrl')
  if (!boardUrl) return NextResponse.json({ error: 'boardUrl required', pins: [] }, { status: 400 })

  const rssUrl = boardUrlToRss(boardUrl)

  try {
    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': UA, 'Accept': 'application/rss+xml, application/xml, text/xml' },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Board not found or private (${res.status})`, pins: [] }, { status: 200 })
    }

    const xml = await res.text()

    if (!xml.includes('<item>')) {
      return NextResponse.json({ error: 'No pins found — board may be private or empty', pins: [] }, { status: 200 })
    }

    const pins = parsePinterestRss(xml)

    // Enrich up to 8 pins with OG images from recipe source sites (parallel)
    const enriched = await Promise.all(pins.slice(0, 8).map(enrichWithOgImage))

    return NextResponse.json({ pins: enriched, total: pins.length })
  } catch (err) {
    return NextResponse.json({ error: 'Could not fetch board RSS', pins: [] }, { status: 200 })
  }
}

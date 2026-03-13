/**
 * Clarityboards — Smart OG Image Fetcher
 * File: app/api/og-image/route.ts
 *
 * Pinterest-aware: detects pin pages, follows the outbound recipe link,
 * fetches the OG image from the actual recipe source site.
 * Falls back to the pin's own og:image if no outbound link found.
 */

import { NextRequest, NextResponse } from 'next/server'

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function fetchOgData(url: string, followPinterest = true): Promise<{ image: string | null; sourceUrl: string | null; title: string | null }> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(9000),
      redirect: 'follow',
    })
    const html = await res.text()

    // Pinterest: follow the outbound recipe URL first
    if (followPinterest && isPinterestPin(url)) {
      const recipeUrl = extractPinterestOutbound(html)
      if (recipeUrl) {
        const sourceResult = await fetchOgData(recipeUrl, false)
        if (sourceResult.image) return { ...sourceResult, sourceUrl: recipeUrl }
      }
    }

    // Standard OG/Twitter image
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
      if (m?.[1]) { image = m[1].startsWith('http') ? m[1] : new URL(m[1], url).href; break }
    }

    // OG title
    const titlePatterns = [
      /property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*property=["']og:title["']/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    ]
    let title: string | null = null
    for (const p of titlePatterns) {
      const m = html.match(p)
      if (m?.[1]) { title = m[1].trim(); break }
    }

    return { image, sourceUrl: url, title }
  } catch {
    return { image: null, sourceUrl: null, title: null }
  }
}

function isPinterestPin(url: string): boolean {
  return /pinterest\.(com|co\.\w+)\/pin\//i.test(url)
}

function extractPinterestOutbound(html: string): string | null {
  const patterns = [
    /"link"\s*:\s*"(https?:\/\/[^"\\]+)"/i,
    /"articleUrl"\s*:\s*"(https?:\/\/[^"\\]+)"/i,
    /"url"\s*:\s*"(https?:\/\/(?!(?:www\.)?pinterest)[^"\\]+)"/i,
    /data-url=["'](https?:\/\/(?!pinterest)[^"']+)["']/i,
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m?.[1]) {
      const url = m[1].replace(/\\/g, '')
      if (!isPinterestPin(url) && url.startsWith('http')) return url
    }
  }
  return null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  if (!url) return NextResponse.json({ image: null, sourceUrl: null, title: null })
  const result = await fetchOgData(url)
  return NextResponse.json(result)
}

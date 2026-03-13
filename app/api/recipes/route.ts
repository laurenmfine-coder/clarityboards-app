/**
 * Clarityboards — Recipe Intelligence API
 * File: app/api/recipes/route.ts
 *
 * POST ?action=search          → ingredient-based recipe search (Spoonacular)
 * POST ?action=analyze-photo   → identify fridge ingredients from image (Claude Vision)
 * POST ?action=import-url      → scrape recipe from any URL or Pinterest pin link
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY

// ── Ingredient search ────────────────────────────────────────────────────────
async function searchByIngredients(ingredients: string[], number = 8) {
  if (!SPOONACULAR_KEY) throw new Error('SPOONACULAR_API_KEY not set')

  const query = ingredients.join(',+')
  const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(query)}&number=${number}&ranking=2&ignorePantry=true&apiKey=${SPOONACULAR_KEY}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Spoonacular error: ${res.status}`)
  const data = await res.json()

  // Fetch brief summaries for each recipe
  return data.map((r: any) => ({
    id: r.id,
    title: r.title,
    image: r.image,
    usedIngredientCount: r.usedIngredientCount,
    missedIngredientCount: r.missedIngredientCount,
    usedIngredients: r.usedIngredients?.map((i: any) => i.name) ?? [],
    missedIngredients: r.missedIngredients?.map((i: any) => i.name) ?? [],
    sourceUrl: `https://spoonacular.com/recipes/${r.title.toLowerCase().replace(/\s+/g, '-')}-${r.id}`,
  }))
}

// ── Get recipe detail from Spoonacular ──────────────────────────────────────
async function getRecipeDetail(id: number) {
  if (!SPOONACULAR_KEY) throw new Error('SPOONACULAR_API_KEY not set')

  const url = `https://api.spoonacular.com/recipes/${id}/information?includeNutrition=false&apiKey=${SPOONACULAR_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Spoonacular error: ${res.status}`)
  return res.json()
}

// ── Analyze fridge photo with Claude Vision ──────────────────────────────────
async function analyzePhoto(imageBase64: string, mediaType: string) {
  const client = new Anthropic()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType as any, data: imageBase64 },
        },
        {
          type: 'text',
          text: `Look at this photo and identify all the food ingredients you can see. 
Return ONLY a JSON array of ingredient names, nothing else. 
Use simple, common names (e.g. "chicken breast", "cheddar cheese", "bell pepper").
Example: ["eggs", "milk", "spinach", "garlic", "chicken breast"]
Only include items that are clearly food ingredients. Ignore condiments, packaging, and non-food items unless they're clearly usable cooking ingredients.`,
        },
      ],
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as string[]
  } catch {
    // Fallback: extract anything that looks like a list
    const matches = text.match(/"([^"]+)"/g)
    return matches ? matches.map(m => m.replace(/"/g, '')) : []
  }
}

// ── Import recipe from URL (including Pinterest redirect) ───────────────────
async function importFromUrl(url: string) {
  // Pinterest pins link out to external recipe sites — follow the link
  // We fetch the page and use Claude to extract the recipe
  let targetUrl = url

  // If it's a Pinterest URL, we need to get the destination link
  if (url.includes('pinterest.com') || url.includes('pin.it')) {
    try {
      const pinRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Clarityboards/1.0)' },
        redirect: 'follow',
      })
      targetUrl = pinRes.url // Follow redirects to the actual recipe site
      if (targetUrl.includes('pinterest.com')) {
        // Pinterest blocked the redirect — try Spoonacular's extract endpoint
        if (SPOONACULAR_KEY) {
          return await extractViaSpoonacular(url)
        }
        throw new Error('Could not follow Pinterest link. Try the direct recipe URL instead.')
      }
    } catch {
      if (SPOONACULAR_KEY) return await extractViaSpoonacular(url)
      throw new Error('Could not follow Pinterest link. Try the direct recipe URL instead.')
    }
  }

  // Try Spoonacular's recipe extraction first (most reliable)
  if (SPOONACULAR_KEY) {
    try {
      return await extractViaSpoonacular(targetUrl)
    } catch {
      // Fall through to Claude extraction
    }
  }

  // Fallback: fetch the page and use Claude to extract
  return await extractViaClaude(targetUrl)
}

async function extractViaSpoonacular(url: string) {
  const endpoint = `https://api.spoonacular.com/recipes/extract?url=${encodeURIComponent(url)}&forceExtraction=false&analyze=false&apiKey=${SPOONACULAR_KEY}`
  const res = await fetch(endpoint)
  if (!res.ok) throw new Error(`Spoonacular extract error: ${res.status}`)
  const data = await res.json()

  return {
    title: data.title,
    image: data.image,
    sourceUrl: data.sourceUrl || url,
    readyInMinutes: data.readyInMinutes,
    servings: data.servings,
    ingredients: data.extendedIngredients?.map((i: any) => i.original) ?? [],
    instructions: data.analyzedInstructions?.[0]?.steps?.map((s: any) => s.step) ?? [],
    summary: data.summary?.replace(/<[^>]+>/g, '') ?? '',
  }
}

async function extractViaClaude(url: string) {
  // Fetch the page HTML
  const pageRes = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Clarityboards/1.0)' },
  })
  const html = await pageRes.text()

  // Strip HTML to get readable text (keep first 8000 chars)
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000)

  const client = new Anthropic()
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Extract the recipe from this webpage text. Return ONLY valid JSON, no markdown, no preamble.

JSON format:
{
  "title": "Recipe name",
  "servings": 4,
  "readyInMinutes": 30,
  "ingredients": ["1 cup flour", "2 eggs"],
  "instructions": ["Step 1 text", "Step 2 text"],
  "summary": "One sentence description"
}

Webpage text:
${text}`,
    }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const clean = raw.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)
  return { ...parsed, sourceUrl: url }
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  try {
    if (action === 'search') {
      const { ingredients, number } = await req.json()
      if (!ingredients?.length) return NextResponse.json({ error: 'No ingredients provided' }, { status: 400 })
      const results = await searchByIngredients(ingredients, number)
      return NextResponse.json({ results })
    }

    if (action === 'recipe-detail') {
      const { id } = await req.json()
      const detail = await getRecipeDetail(id)
      return NextResponse.json({ recipe: detail })
    }

    if (action === 'analyze-photo') {
      const { imageBase64, mediaType } = await req.json()
      if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 })
      const ingredients = await analyzePhoto(imageBase64, mediaType || 'image/jpeg')
      return NextResponse.json({ ingredients })
    }

    if (action === 'import-url') {
      const { url } = await req.json()
      if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
      const recipe = await importFromUrl(url)
      return NextResponse.json({ recipe })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    console.error('[recipes]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}

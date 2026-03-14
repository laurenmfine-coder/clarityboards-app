/**
 * Clarityboards — AI Trip Planner
 * File: app/api/trip-planner/route.ts
 *
 * POST /api/trip-planner
 * Body: { destination, days, style, interests }
 * Returns: structured day-by-day itinerary with real place suggestions
 *
 * POST /api/trip-planner?action=search-places
 * Body: { query, destination }
 * Returns: place suggestions with categories
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface PlaceSuggestion {
  name: string
  category: 'restaurant' | 'hotel' | 'activity' | 'place' | 'other'
  description: string
  address?: string
  tipTime?: string
  why?: string
}

interface DaySuggestion {
  day: number
  theme: string
  places: PlaceSuggestion[]
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const body = await req.json()

  // ── Place search ──────────────────────────────────────────
  if (action === 'search-places') {
    const { query, destination } = body
    if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 })

    try {
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `You are a knowledgeable travel expert. Find 4-6 specific, real places matching this search in ${destination || 'the destination'}: "${query}"

Return ONLY a JSON array, no other text:
[
  {
    "name": "exact place name",
    "category": "restaurant|hotel|activity|place|other",
    "description": "one sentence why it's special",
    "address": "street address or neighborhood if known",
    "tipTime": "best time to visit e.g. evening, morning, weekday",
    "why": "2-3 word hook e.g. Best croissants, Hidden gem, Must-see view"
  }
]

Only include places you are confident exist. Be specific with real names.`
        }]
      })

      const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
      const clean = text.replace(/```json|```/g, '').trim()
      const places = JSON.parse(clean)
      return NextResponse.json({ places })
    } catch (e) {
      return NextResponse.json({ error: 'Search failed', places: [] })
    }
  }

  // ── Full trip planner ─────────────────────────────────────
  const { destination, days = 3, style = 'balanced', interests = [] } = body
  if (!destination) return NextResponse.json({ error: 'destination required' }, { status: 400 })

  const styleDescriptions: Record<string, string> = {
    relaxed:    'slow-paced, cafes, parks, minimal rushing',
    balanced:   'mix of sightseeing, food, and downtime',
    packed:     'maximum sights, efficient routing, early starts',
    foodie:     'food-first — markets, restaurants, cooking classes, tastings',
    cultural:   'museums, galleries, history, architecture',
    adventure:  'outdoor activities, hiking, sports, physical experiences',
  }

  const interestList = interests.length > 0 ? interests.join(', ') : 'general sightseeing, food, culture'
  const styleDesc = styleDescriptions[style] || styleDescriptions.balanced

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{
        role: 'user',
        content: `You are an expert travel planner creating a real, specific ${days}-day itinerary for ${destination}.

Travel style: ${styleDesc}
Interests: ${interestList}

Create a practical day-by-day plan with REAL, SPECIFIC places (actual restaurant names, museum names, neighborhood names). Each day should have 3-5 places.

Return ONLY valid JSON, no other text:
{
  "title": "evocative trip title e.g. 4 Days in Paris: Art, Bistros & Hidden Courtyards",
  "overview": "2 sentence trip summary highlighting what makes this itinerary special",
  "days": [
    {
      "day": 1,
      "theme": "short evocative day theme e.g. Arrival & Left Bank Wandering",
      "places": [
        {
          "name": "exact real place name",
          "category": "restaurant|hotel|activity|place|other",
          "description": "one sentence what it is and why included",
          "address": "neighborhood or address if known",
          "tipTime": "Morning|Midday|Afternoon|Evening|Night",
          "why": "2-3 word hook e.g. Best falafel, Iconic view, Local secret"
        }
      ]
    }
  ]
}

Only use real places. Be specific. Make it feel like a friend who knows ${destination} well wrote it.`
      }]
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const itinerary = JSON.parse(clean)
    return NextResponse.json({ itinerary })
  } catch (e) {
    console.error('Trip planner error:', e)
    return NextResponse.json({ error: 'Could not generate itinerary. Please try again.' }, { status: 500 })
  }
}

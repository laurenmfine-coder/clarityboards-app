/**
 * Clarityboards — Watch shared utilities
 * File: lib/watch.ts
 */

import Anthropic from '@anthropic-ai/sdk'

export async function extractFromUrl(url: string, watchType: string): Promise<{ value: number | null; text: string }> {
  let html = ''
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })
    html = await res.text()
  } catch {
    throw new Error('Could not fetch that URL. Make sure it is publicly accessible.')
  }

  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 6000)

  const client = new Anthropic()

  if (watchType === 'price') {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Find the main price on this webpage. Return ONLY a JSON object like {"price": 299.99, "currency": "USD", "label": "Economy from MIA"} or {"price": null} if no price found. No markdown, no explanation.\n\nWebpage text:\n${text}`
      }]
    })
    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      return { value: parsed.price ?? null, text: parsed.label ?? '' }
    } catch {
      return { value: null, text: '' }
    }
  }

  if (watchType === 'availability') {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Is there any appointment, slot, seat, ticket, or availability shown on this page? Return ONLY JSON like {"available": true, "text": "3 slots available Thursday"} or {"available": false, "text": "No availability"}. No markdown.\n\nWebpage text:\n${text}`
      }]
    })
    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      return { value: parsed.available ? 1 : 0, text: parsed.text ?? '' }
    } catch {
      return { value: 0, text: '' }
    }
  }

  // 'change' type
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `Summarize the most important/current information on this page in 1-2 sentences. Return ONLY JSON like {"text": "summary here"}. No markdown.\n\nWebpage text:\n${text}`
    }]
  })
  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return { value: null, text: parsed.text ?? '' }
  } catch {
    return { value: null, text: '' }
  }
}

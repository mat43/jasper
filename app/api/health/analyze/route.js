import { NextResponse } from 'next/server'
import { requireAuth, parseBody, logError } from '@/lib/auth'
import { analyzePhotoSchema } from '@/lib/schemas'
import OpenAI from 'openai'

export async function POST(req) {
  const { unauth } = await requireAuth()
  if (unauth) return unauth

  const { data, bodyError } = await parseBody(req, analyzePhotoSchema)
  if (bodyError) return bodyError

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI not configured — set OPENAI_API_KEY in .env' },
      { status: 503 }
    )
  }

  try {
    let { imageData, mimeType, context } = data

    // Validate image type from data URL
    if (imageData.startsWith('data:')) {
      const match = imageData.match(/^data:(image\/[\w+]+);base64,/)
      if (!match) return NextResponse.json({ error: 'Invalid image data URL' }, { status: 400 })
      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowed.includes(match[1])) {
        return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 })
      }
    }

    const contextNote = context ? `\nAdditional context from the user: "${context}"` : ''
    const prompt =
      'Analyze this food image and estimate its nutritional content.' + contextNote + '\n' +
      'Return ONLY a valid JSON object — no markdown, no explanation — with exactly these fields:\n' +
      '{\n' +
      '  "foodName": "descriptive name",\n' +
      '  "servingDescription": "e.g. 1 plate, 2 slices, 1 cup",\n' +
      '  "calories": <integer>,\n' +
      '  "protein": <grams as number>,\n' +
      '  "carbs": <grams as number>,\n' +
      '  "fat": <grams as number>,\n' +
      '  "fiber": <grams as number>,\n' +
      '  "confidence": "low" | "medium" | "high"\n' +
      '}\n' +
      'Be conservative. If multiple items are visible, estimate the total. Use the user context to improve accuracy.'

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await client.chat.completions.create({
      model: 'gpt-5.5',
      max_completion_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageData, detail: 'original' } },
          { type: 'text', text: prompt },
        ],
      }],
    })

    const text = response.choices[0].message.content.trim()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found in model response')
      parsed = JSON.parse(jsonMatch[0])
    }

    // Normalise and validate
    return NextResponse.json({
      foodName:           String(parsed.foodName || 'Unknown food'),
      servingDescription: String(parsed.servingDescription || '1 serving'),
      calories:           Math.max(0, Math.round(Number(parsed.calories) || 0)),
      protein:            Math.max(0, Number(parsed.protein)  || 0),
      carbs:              Math.max(0, Number(parsed.carbs)    || 0),
      fat:                Math.max(0, Number(parsed.fat)      || 0),
      fiber:              Math.max(0, Number(parsed.fiber)    || 0),
      confidence:         ['low', 'medium', 'high'].includes(parsed.confidence) ? parsed.confidence : 'medium',
    })
  } catch (err) {
    logError('POST /api/health/analyze', err)
    if (err?.status === 401) {
      return NextResponse.json({ error: 'Invalid OpenAI API key.' }, { status: 503 })
    }
    if (err?.status === 429) {
      return NextResponse.json({ error: 'OpenAI rate limit reached. Try again shortly.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}

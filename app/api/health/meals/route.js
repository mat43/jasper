import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, parseBody, logError } from '@/lib/auth'
import { createPresetMealSchema } from '@/lib/schemas'

export async function GET() {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  try {
    const meals = await prisma.presetMeal.findMany({
      where: { createdBy: session.user.username },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(
      meals.map(m => ({ ...m, items: JSON.parse(m.items) }))
    )
  } catch (err) {
    logError('GET /api/health/meals', err)
    return NextResponse.json({ error: 'Failed to fetch preset meals' }, { status: 500 })
  }
}

export async function POST(req) {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  const { data, bodyError } = await parseBody(req, createPresetMealSchema)
  if (bodyError) return bodyError

  try {
    const meal = await prisma.presetMeal.create({
      data: {
        name:      data.name,
        items:     JSON.stringify(data.items),
        createdBy: session.user.username,
      },
    })
    return NextResponse.json({ ...meal, items: data.items }, { status: 201 })
  } catch (err) {
    logError('POST /api/health/meals', err)
    return NextResponse.json({ error: 'Failed to create preset meal' }, { status: 500 })
  }
}

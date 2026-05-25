import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, parseBody, logError } from '@/lib/auth'
import { createFoodItemSchema } from '@/lib/schemas'

// Search all food items (shared library — anyone can use any item)
export async function GET(req) {
  const { unauth } = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()

  try {
    const foods = await prisma.foodItem.findMany({
      where: q ? { name: { contains: q } } : undefined,
      orderBy: { name: 'asc' },
      take: 25,
    })
    return NextResponse.json(foods)
  } catch (err) {
    logError('GET /api/health/foods', err)
    return NextResponse.json({ error: 'Failed to fetch foods' }, { status: 500 })
  }
}

export async function POST(req) {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  const { data, bodyError } = await parseBody(req, createFoodItemSchema)
  if (bodyError) return bodyError

  try {
    const food = await prisma.foodItem.create({
      data: { ...data, createdBy: session.user.username },
    })
    return NextResponse.json(food, { status: 201 })
  } catch (err) {
    logError('POST /api/health/foods', err)
    return NextResponse.json({ error: 'Failed to create food item' }, { status: 500 })
  }
}

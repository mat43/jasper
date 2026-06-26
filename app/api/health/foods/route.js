import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, parseBody, logError } from '@/lib/auth'
import { createFoodItemSchema } from '@/lib/schemas'

// Search the shared food library (anyone can log any item), OR browse the
// caller's own library with `?mine=1` — used by the Library manager, which
// also needs each item's log-usage count to warn before deleting.
export async function GET(req) {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const q    = (searchParams.get('q') || '').trim()
  const mine = searchParams.get('mine') === '1'

  try {
    if (mine) {
      const where = { createdBy: session.user.username }
      if (q) where.name = { contains: q }
      const foods = await prisma.foodItem.findMany({
        where,
        orderBy: { id: 'desc' }, // most recently added first — easiest to clean up
        take: 300,
        include: { _count: { select: { logs: true } } },
      })
      return NextResponse.json(foods)
    }

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

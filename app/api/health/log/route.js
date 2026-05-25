import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, parseBody, logError } from '@/lib/auth'
import { createFoodLogSchema } from '@/lib/schemas'

// Returns all logs for a given day (?date=YYYY-MM-DD),
// a full week (?range=week&date=YYYY-MM-DD),
// or all-time (?range=all).
export async function GET(req) {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const date  = searchParams.get('date')
  const range = searchParams.get('range')

  try {
    let where = { userId: session.user.id }

    if (range === 'week' && date) {
      const d   = new Date(date + 'T12:00:00')
      const dow = d.getDay() // 0 = Sun
      const diffToMon = (dow === 0 ? -6 : 1 - dow)
      const mon = new Date(d)
      mon.setDate(d.getDate() + diffToMon)
      const days = Array.from({ length: 7 }, (_, i) => {
        const dd = new Date(mon)
        dd.setDate(mon.getDate() + i)
        return dd.toISOString().slice(0, 10)
      })
      where.logDate = { in: days }
    } else if (range === 'all') {
      // no date filter
    } else if (date) {
      where.logDate = date
    }

    const logs = await prisma.foodLog.findMany({
      where,
      include: { foodItem: true },
      orderBy: { loggedAt: 'asc' },
    })

    return NextResponse.json(logs)
  } catch (err) {
    logError('GET /api/health/log', err)
    return NextResponse.json({ error: 'Failed to fetch log' }, { status: 500 })
  }
}

export async function POST(req) {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  const { data, bodyError } = await parseBody(req, createFoodLogSchema)
  if (bodyError) return bodyError

  try {
    const log = await prisma.foodLog.create({
      data: { userId: session.user.id, ...data },
      include: { foodItem: true },
    })
    return NextResponse.json(log, { status: 201 })
  } catch (err) {
    logError('POST /api/health/log', err)
    return NextResponse.json({ error: 'Failed to add log entry' }, { status: 500 })
  }
}

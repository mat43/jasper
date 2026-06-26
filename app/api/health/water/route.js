import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, parseBody, logError } from '@/lib/auth'
import { createWaterLogSchema } from '@/lib/schemas'

// Water intake is stored as a single running total per user per day.
//   GET  ?date=YYYY-MM-DD  → { amount } for that day (0 if none)
//   GET  ?range=week&date= → array of { logDate, amount } for the Mon–Sun week
//   POST { amount, logDate } → adds `amount` oz to that day (negative undoes),
//                              clamped at 0, and returns the new total.
export async function GET(req) {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const date  = searchParams.get('date')
  const range = searchParams.get('range')

  try {
    if (range === 'week' && date) {
      const d   = new Date(date + 'T12:00:00')
      const dow = d.getDay()
      const diffToMon = (dow === 0 ? -6 : 1 - dow)
      const mon = new Date(d)
      mon.setDate(d.getDate() + diffToMon)
      const days = Array.from({ length: 7 }, (_, i) => {
        const dd = new Date(mon)
        dd.setDate(mon.getDate() + i)
        return dd.toISOString().slice(0, 10)
      })
      const rows = await prisma.waterLog.findMany({
        where: { userId: session.user.id, logDate: { in: days } },
        select: { logDate: true, amount: true },
      })
      return NextResponse.json(rows)
    }

    const row = date
      ? await prisma.waterLog.findUnique({
          where: { userId_logDate: { userId: session.user.id, logDate: date } },
          select: { amount: true },
        })
      : null
    return NextResponse.json({ amount: row?.amount ?? 0 })
  } catch (err) {
    logError('GET /api/health/water', err)
    return NextResponse.json({ error: 'Failed to fetch water' }, { status: 500 })
  }
}

export async function POST(req) {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  const { data, bodyError } = await parseBody(req, createWaterLogSchema)
  if (bodyError) return bodyError

  try {
    const key = { userId_logDate: { userId: session.user.id, logDate: data.logDate } }
    const existing = await prisma.waterLog.findUnique({ where: key, select: { amount: true } })
    const next = Math.max(0, (existing?.amount ?? 0) + data.amount)

    const row = await prisma.waterLog.upsert({
      where:  key,
      update: { amount: next },
      create: { userId: session.user.id, logDate: data.logDate, amount: next },
      select: { amount: true },
    })
    return NextResponse.json(row, { status: 200 })
  } catch (err) {
    logError('POST /api/health/water', err)
    return NextResponse.json({ error: 'Failed to log water' }, { status: 500 })
  }
}

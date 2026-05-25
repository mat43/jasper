import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, parseBody, logError } from '@/lib/auth'
import { createWeightLogSchema } from '@/lib/schemas'

export async function GET() {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  try {
    const logs = await prisma.weightLog.findMany({
      where: { userId: session.user.id },
      orderBy: { loggedAt: 'desc' },
      take: 90,
    })
    return NextResponse.json(logs)
  } catch (err) {
    logError('GET /api/health/weight', err)
    return NextResponse.json({ error: 'Failed to fetch weight log' }, { status: 500 })
  }
}

export async function POST(req) {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  const { data, bodyError } = await parseBody(req, createWeightLogSchema)
  if (bodyError) return bodyError

  try {
    const log = await prisma.weightLog.create({
      data: { userId: session.user.id, weight: data.weight },
    })
    return NextResponse.json(log, { status: 201 })
  } catch (err) {
    logError('POST /api/health/weight', err)
    return NextResponse.json({ error: 'Failed to log weight' }, { status: 500 })
  }
}

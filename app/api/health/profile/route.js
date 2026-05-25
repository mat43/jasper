import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, parseBody, logError } from '@/lib/auth'
import { patchHealthProfileSchema } from '@/lib/schemas'

export async function GET() {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  try {
    let profile = await prisma.userHealthProfile.findUnique({
      where: { userId: session.user.id },
    })
    if (!profile) {
      profile = await prisma.userHealthProfile.create({
        data: { userId: session.user.id },
      })
    }
    return NextResponse.json(profile)
  } catch (err) {
    logError('GET /api/health/profile', err)
    return NextResponse.json({ error: 'Failed to fetch health profile' }, { status: 500 })
  }
}

export async function PATCH(req) {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  const { data, bodyError } = await parseBody(req, patchHealthProfileSchema)
  if (bodyError) return bodyError

  try {
    const profile = await prisma.userHealthProfile.upsert({
      where:  { userId: session.user.id },
      update: data,
      create: { userId: session.user.id, ...data },
    })
    return NextResponse.json(profile)
  } catch (err) {
    logError('PATCH /api/health/profile', err)
    return NextResponse.json({ error: 'Failed to update health profile' }, { status: 500 })
  }
}

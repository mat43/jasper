import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, parseIntId, logError } from '@/lib/auth'

export async function DELETE(req, { params }) {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  const id = parseIntId((await params).id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    const meal = await prisma.presetMeal.findUnique({ where: { id } })
    if (!meal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (meal.createdBy !== session.user.username)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.presetMeal.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    logError('DELETE /api/health/meals/[id]', err)
    return NextResponse.json({ error: 'Failed to delete preset meal' }, { status: 500 })
  }
}

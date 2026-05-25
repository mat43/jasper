import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, parseIntId, logError } from '@/lib/auth'

export async function DELETE(req, { params }) {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  const id = parseIntId((await params).id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    const entry = await prisma.foodLog.findUnique({ where: { id } })
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (entry.userId !== session.user.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.foodLog.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    logError('DELETE /api/health/log/[id]', err)
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
  }
}

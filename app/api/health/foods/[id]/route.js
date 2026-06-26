import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, parseIntId, logError } from '@/lib/auth'

// Delete a food item from the library.
//   • Only the creator (or an admin) may delete it.
//   • If other people have logged it, a non-admin is blocked (409) so we never
//     wipe someone else's history. Admins may force-delete (cascading all logs).
//   • Otherwise the item and the caller's own logs of it are removed together.
export async function DELETE(req, { params }) {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  const id = parseIntId((await params).id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    const food = await prisma.foodItem.findUnique({
      where: { id },
      select: { id: true, createdBy: true },
    })
    if (!food) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isAdmin = !!session.user.isAdmin
    if (food.createdBy !== session.user.username && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!isAdmin) {
      const othersLogs = await prisma.foodLog.count({
        where: { foodItemId: id, userId: { not: session.user.id } },
      })
      if (othersLogs > 0) {
        return NextResponse.json(
          { error: "This item is logged by other people, so it can't be deleted." },
          { status: 409 }
        )
      }
    }

    const logWhere = isAdmin ? { foodItemId: id } : { foodItemId: id, userId: session.user.id }
    const [{ count: removedLogs }] = await prisma.$transaction([
      prisma.foodLog.deleteMany({ where: logWhere }),
      prisma.foodItem.delete({ where: { id } }),
    ])

    return NextResponse.json({ removedLogs }, { status: 200 })
  } catch (err) {
    logError('DELETE /api/health/foods/[id]', err)
    return NextResponse.json({ error: 'Failed to delete food item' }, { status: 500 })
  }
}

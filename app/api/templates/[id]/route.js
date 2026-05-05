import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, parseBody, parseIntId, logError } from '@/lib/auth'
import { patchTemplateSchema } from '@/lib/schemas'

// DELETE /api/templates/[id]
// Only the template creator may delete their own rule.
export async function DELETE(request, context) {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  const id = parseIntId((await context.params).id)
  if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const tpl = await prisma.expenseTemplate.findUnique({
      where:  { id },
      select: { createdBy: true },
    })
    if (!tpl) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (tpl.createdBy !== session.user.username) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.expenseTemplate.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    logError('DELETE /api/templates/[id]', err)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}

// PATCH /api/templates/[id]
// Any authenticated household member may update schedule fields.
export async function PATCH(request, context) {
  const { unauth } = await requireAuth()
  if (unauth) return unauth

  const id = parseIntId((await context.params).id)
  if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const { data, bodyError } = await parseBody(request, patchTemplateSchema)
  if (bodyError) return bodyError

  try {
    const updates = {}
    if (data.frequency  !== undefined) updates.frequency  = data.frequency
    if (data.dayOfMonth !== undefined) updates.dayOfMonth = data.dayOfMonth
    if (data.dayOfWeek  !== undefined) updates.dayOfWeek  = data.dayOfWeek

    const updated = await prisma.expenseTemplate.update({ where: { id }, data: updates })

    let assignees = []
    try {
      const parsed = JSON.parse(updated.assignees || '[]')
      assignees = Array.isArray(parsed) ? parsed : []
    } catch { /* leave empty */ }

    return NextResponse.json({ ...updated, assignees }, { status: 200 })
  } catch (err) {
    logError('PATCH /api/templates/[id]', err)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}


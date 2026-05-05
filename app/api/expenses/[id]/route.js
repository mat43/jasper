import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, parseBody, parseIntId, logError } from '@/lib/auth'
import { patchExpenseSchema } from '@/lib/schemas'

// DELETE /api/expenses/[id]
// Only the expense creator may delete their own record.
export async function DELETE(request, context) {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  const id = parseIntId((await context.params).id)
  if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const expense = await prisma.expense.findUnique({
      where:  { id },
      select: { createdBy: true },
    })
    if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (expense.createdBy !== session.user.username) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.expense.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    logError('DELETE /api/expenses/[id]', err)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}

// PATCH /api/expenses/[id]
// Any authenticated household member may mark an expense as paid/unpaid.
export async function PATCH(request, context) {
  const { unauth } = await requireAuth()
  if (unauth) return unauth

  const id = parseIntId((await context.params).id)
  if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const { data, bodyError } = await parseBody(request, patchExpenseSchema)
  if (bodyError) return bodyError

  try {
    const updated = await prisma.expense.update({
      where: { id },
      data:  { paid: data.paid },
    })
    return NextResponse.json(updated, { status: 200 })
  } catch (err) {
    logError('PATCH /api/expenses/[id]', err)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}


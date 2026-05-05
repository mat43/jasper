import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, parseBody, logError } from '@/lib/auth'
import { createExpenseSchema } from '@/lib/schemas'

function normalizeAssignees(raw) {
  try {
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function GET() {
  const { unauth } = await requireAuth()
  if (unauth) return unauth

  try {
    const expenses = await prisma.expense.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(
      expenses.map(e => ({ ...e, assignees: normalizeAssignees(e.assignees) })),
      { status: 200 }
    )
  } catch (err) {
    logError('GET /api/expenses', err)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request) {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  const { data, bodyError } = await parseBody(request, createExpenseSchema)
  if (bodyError) return bodyError

  try {
    const { description, amount, category, assignees, templateId } = data
    const createdBy = session.user.username
    const expense = await prisma.expense.create({
      data: {
        description,
        amount,
        category,
        assignees:  JSON.stringify(assignees),
        createdBy,
        templateId: templateId ?? null,
        paid:       assignees.includes(createdBy),
      },
    })
    return NextResponse.json({ ...expense, assignees }, { status: 201 })
  } catch (err) {
    logError('POST /api/expenses', err)
    return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 })
  }
}


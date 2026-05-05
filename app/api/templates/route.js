import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, parseBody, logError } from '@/lib/auth'
import { createTemplateSchema } from '@/lib/schemas'

function parseAssignees(raw) {
  try {
    const p = JSON.parse(raw || '[]')
    return Array.isArray(p) ? p : []
  } catch {
    return []
  }
}

export async function GET() {
  const { unauth } = await requireAuth()
  if (unauth) return unauth

  try {
    const raw = await prisma.expenseTemplate.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(raw.map(t => ({ ...t, assignees: parseAssignees(t.assignees) })))
  } catch (err) {
    logError('GET /api/templates', err)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request) {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  const { data, bodyError } = await parseBody(request, createTemplateSchema)
  if (bodyError) return bodyError

  try {
    const { description, amount, category, assignees, frequency, dayOfMonth, dayOfWeek } = data
    const tpl = await prisma.expenseTemplate.create({
      data: {
        description,
        amount,
        category,
        assignees:  JSON.stringify(assignees),
        frequency,
        dayOfMonth: frequency === 'monthly' ? (dayOfMonth ?? null) : null,
        dayOfWeek:  frequency === 'weekly'  ? (dayOfWeek  ?? null) : null,
        createdBy:  session.user.username,
      },
    })
    return NextResponse.json({ ...tpl, assignees }, { status: 201 })
  } catch (err) {
    logError('POST /api/templates', err)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}


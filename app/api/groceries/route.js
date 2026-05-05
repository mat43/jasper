import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, parseBody, logError } from '@/lib/auth'
import {
  createGrocerySchema,
  patchGrocerySchema,
  deleteGrocerySchema,
} from '@/lib/schemas'

export async function GET() {
  const { unauth } = await requireAuth()
  if (unauth) return unauth

  try {
    const list = await prisma.list.findMany({ orderBy: { createdAt: 'asc' } })
    return NextResponse.json(list)
  } catch (err) {
    logError('GET /api/groceries', err)
    return NextResponse.json({ error: 'Failed to fetch groceries' }, { status: 500 })
  }
}

export async function POST(request) {
  const { unauth } = await requireAuth()
  if (unauth) return unauth

  const { data, bodyError } = await parseBody(request, createGrocerySchema)
  if (bodyError) return bodyError

  try {
    const newItem = await prisma.list.create({ data: { label: data.label } })
    return NextResponse.json(newItem, { status: 201 })
  } catch (err) {
    logError('POST /api/groceries', err)
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 })
  }
}

export async function PATCH(request) {
  const { unauth } = await requireAuth()
  if (unauth) return unauth

  const { data, bodyError } = await parseBody(request, patchGrocerySchema)
  if (bodyError) return bodyError

  try {
    const updated = await prisma.list.update({
      where: { id: data.id },
      data:  { done: data.done },
    })
    return NextResponse.json(updated)
  } catch (err) {
    logError('PATCH /api/groceries', err)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(request) {
  const { unauth } = await requireAuth()
  if (unauth) return unauth

  const { data, bodyError } = await parseBody(request, deleteGrocerySchema)
  if (bodyError) return bodyError

  try {
    await prisma.list.delete({ where: { id: data.id } })
    return NextResponse.json({ id: data.id })
  } catch (err) {
    logError('DELETE /api/groceries', err)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}

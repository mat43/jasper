import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin, parseBody } from '@/lib/auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const updateUserSchema = z.object({
  name:          z.string().min(1).max(100).optional(),
  email:         z.string().email().optional().or(z.literal('')),
  venmoUsername: z.string().max(50).optional().or(z.literal('')),
  password:      z.string().min(8).max(128).optional(),
  isAdmin:       z.boolean().optional(),
  isActive:      z.boolean().optional(),
}).strict()

// PATCH /api/admin/users/[username] — update a user (admin only)
export async function PATCH(request, { params }) {
  const { session, unauth } = await requireAdmin()
  if (unauth) return unauth

  const { username } = await params
  const { data, bodyError } = await parseBody(request, updateUserSchema)
  if (bodyError) return bodyError

  const existing = await prisma.user.findUnique({ where: { username } })
  if (!existing) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const updates = { ...data }
  if (data.password) {
    updates.password = await bcrypt.hash(data.password, 12)
  }
  if ('email' in updates && updates.email === '') {
    updates.email = null
  }
  if ('venmoUsername' in updates && updates.venmoUsername === '') {
    updates.venmoUsername = null
  }

  const user = await prisma.user.update({
    where: { username },
    data: updates,
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      venmoUsername: true,
      isAdmin: true,
      isActive: true,
    },
  })
  return NextResponse.json(user)
}

// DELETE /api/admin/users/[username] — permanently delete a user (admin only)
export async function DELETE(request, { params }) {
  const { session, unauth } = await requireAdmin()
  if (unauth) return unauth

  const { username } = await params

  if (session.user.username === username) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (!existing) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  await prisma.user.delete({ where: { username } })
  return NextResponse.json({ success: true })
}

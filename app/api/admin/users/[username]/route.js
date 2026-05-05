import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin, parseBody } from '@/lib/auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const patchUserSchema = z.object({
  name:         z.string().min(1).max(100).optional(),
  email:        z.string().email().optional().or(z.literal('')),
  venmoUsername:z.string().max(50).optional().or(z.literal('')),
  password:     z.string().min(8).max(128).optional(),
  isAdmin:      z.boolean().optional(),
  isActive:     z.boolean().optional(),
}).strict()

// PATCH /api/admin/users/[username] — update any user field (admin only)
export async function PATCH(request, { params }) {
  const { unauth } = await requireAdmin()
  if (unauth) return unauth

  const { data, bodyError } = await parseBody(request, patchUserSchema)
  if (bodyError) return bodyError

  const target = await prisma.user.findUnique({ where: { username: params.username } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const updateData = {}
  if (data.name         !== undefined) updateData.name          = data.name
  if (data.email        !== undefined) updateData.email         = data.email || null
  if (data.venmoUsername !== undefined) updateData.venmoUsername = data.venmoUsername || null
  if (data.isAdmin      !== undefined) updateData.isAdmin       = data.isAdmin
  if (data.isActive     !== undefined) updateData.isActive      = data.isActive
  if (data.password     !== undefined) updateData.password      = await bcrypt.hash(data.password, 12)

  const updated = await prisma.user.update({
    where: { username: params.username },
    data: updateData,
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      venmoUsername: true,
      avatarUrl: true,
      isAdmin: true,
      isActive: true,
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/admin/users/[username] — permanently delete a user (admin only)
export async function DELETE(request, { params }) {
  const { session, unauth } = await requireAdmin()
  if (unauth) return unauth

  // Prevent self-deletion
  if (params.username === session.user.username) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { username: params.username } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await prisma.user.delete({ where: { username: params.username } })
  return new NextResponse(null, { status: 204 })
}

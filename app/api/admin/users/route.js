import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin, parseBody } from '@/lib/auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// GET /api/admin/users — list all users (admin only)
export async function GET() {
  const { unauth } = await requireAdmin()
  if (unauth) return unauth

  const users = await prisma.user.findMany({
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
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(users)
}

const createUserSchema = z.object({
  username: z.string().min(1).max(50).regex(/^[a-z0-9_.-]+$/, 'Username may only contain lowercase letters, numbers, underscores, hyphens, and dots'),
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(8).max(128),
  isAdmin: z.boolean().optional().default(false),
})

// POST /api/admin/users — create a new user (admin only)
export async function POST(request) {
  const { unauth } = await requireAdmin()
  if (unauth) return unauth

  const { data, bodyError } = await parseBody(request, createUserSchema)
  if (bodyError) return bodyError

  const exists = await prisma.user.findUnique({ where: { username: data.username } })
  if (exists) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(data.password, 12)

  const user = await prisma.user.create({
    data: {
      username: data.username,
      name: data.name,
      email: data.email || null,
      password: hashed,
      isAdmin: data.isAdmin,
      isActive: true,
    },
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

  return NextResponse.json(user, { status: 201 })
}

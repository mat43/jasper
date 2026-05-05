import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET /api/users
// Returns every user's username + display name for use in assignee pickers.
// Intentionally excludes password, email, venmoUsername, avatarUrl — only
// the fields needed to populate a form selector.
export async function GET() {
  const { unauth } = await requireAuth()
  if (unauth) return unauth

  const users = await prisma.user.findMany({
    select: { username: true, name: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(users)
}

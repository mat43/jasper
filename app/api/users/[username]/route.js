import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET /api/users/[username]
// Used internally to look up another user's Venmo handle for settlement flows.
// Requires authentication — Venmo usernames are private household data.
export async function GET(request, { params }) {
  const { unauth } = await requireAuth()
  if (unauth) return unauth

  const { username } = await params

  const user = await prisma.user.findUnique({
    where:  { username },
    select: { venmoUsername: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  return NextResponse.json(user)
}


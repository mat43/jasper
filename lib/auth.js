// Shared server-side auth helpers used by every private API route.
// Never import this file in client components.

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { NextResponse } from 'next/server'

/** Returns the current session, or null if unauthenticated. */
export async function getSession() {
  return getServerSession(authOptions)
}

/**
 * Enforces authentication.
 * Returns { session } on success or { unauth: Response } (HTTP 401) on failure.
 *
 * Usage:
 *   const { session, unauth } = await requireAuth()
 *   if (unauth) return unauth
 */
export async function requireAuth() {
  const session = await getSession()
  if (!session?.user?.id) {
    return {
      session: null,
      unauth: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { session, unauth: null }
}

/**
 * Enforces admin-only access.
 * Returns { session } if authenticated and isAdmin, or the appropriate error Response.
 *
 * Usage:
 *   const { session, unauth } = await requireAdmin()
 *   if (unauth) return unauth
 */
export async function requireAdmin() {
  const session = await getSession()
  if (!session?.user?.id) {
    return {
      session: null,
      unauth: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  if (!session.user.isAdmin) {
    return {
      session: null,
      unauth: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }
  return { session, unauth: null }
}

/**
 * Parses and validates a request body against a Zod schema.
 * Returns { data } on success or { bodyError: Response } (HTTP 400) on failure.
 *
 * Usage:
 *   const { data, bodyError } = await parseBody(request, mySchema)
 *   if (bodyError) return bodyError
 */
export async function parseBody(request, schema) {
  let raw
  try {
    raw = await request.json()
  } catch {
    return {
      data: null,
      bodyError: NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }),
    }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    return {
      data: null,
      bodyError: NextResponse.json(
        { error: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      ),
    }
  }
  return { data: result.data, bodyError: null }
}

/**
 * Parses a route segment parameter as a positive integer.
 * Returns the integer, or null if the value is not a valid positive integer.
 */
export function parseIntId(raw) {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1) return null
  return n
}

/**
 * Logs an error safely:
 * - In development: full error object for debugging
 * - In production: only error code / first 100 chars of message
 *   (avoids leaking env vars or tokens that may appear in full stack traces)
 */
export function logError(context, err) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, err)
  } else {
    const safe = err?.code ?? err?.message?.slice(0, 100) ?? 'unknown'
    console.error(`[${context}]`, safe)
  }
}

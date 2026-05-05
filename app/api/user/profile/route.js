import { NextResponse } from 'next/server'
import { requireAuth, parseBody, logError } from '@/lib/auth'
import { patchProfileSchema } from '@/lib/schemas'
import prisma from '@/lib/prisma'

export async function PATCH(req) {
  const { session, unauth } = await requireAuth()
  if (unauth) return unauth

  const { data, bodyError } = await parseBody(req, patchProfileSchema)
  if (bodyError) return bodyError

  const { firstName, lastName, email, venmo, avatar, password } = data

  // ── Avatar upload ─────────────────────────────────────────────────────────
  let avatarUrl = avatar
  if (avatar && avatar.startsWith('data:')) {
    try {
      const [, base64]  = avatar.split(',')
      const mimeMatch   = avatar.match(/data:(image\/\w+);/)
      const mimeType    = mimeMatch ? mimeMatch[1] : 'image/png'
      const ext         = mimeType.split('/')[1] || 'png'
      const filename    = `${session.user.username}-${Date.now()}.${ext}`
      const buffer      = Buffer.from(base64, 'base64')

      const formData = new FormData()
      formData.append('file', new Blob([buffer], { type: mimeType }), filename)

      const uploadRes = await fetch('https://img.mathew.ws/upload', {
        method: 'POST',
        body:   formData,
      })

      if (!uploadRes.ok) throw new Error('Upload service returned non-2xx')

      const uploadData = await uploadRes.json()

      // Validate the returned URL before storing it
      if (!uploadData.url || typeof uploadData.url !== 'string') {
        throw new Error('Upload service returned invalid URL')
      }
      new URL(uploadData.url) // throws if not a valid absolute URL

      avatarUrl = uploadData.url + '/inline'
    } catch (err) {
      logError('profile avatar upload', err)
      return NextResponse.json({ error: 'Avatar upload failed' }, { status: 500 })
    }
  }

  // ── Build update payload ──────────────────────────────────────────────────
  const updateData = {
    avatarUrl,
    name:          `${firstName ?? ''} ${lastName ?? ''}`.trim() || undefined,
    email:         email  || undefined,
    venmoUsername: venmo  || undefined,
  }

  // Only hash & store password when it was explicitly supplied (Zod already
  // verified that password === confirm before we get here)
  if (password) {
    const bcrypt = await import('bcryptjs')
    updateData.password = await bcrypt.hash(password, 12)
  }

  try {
    const updatedUser = await prisma.user.update({
      where:  { username: session.user.username },
      data:   updateData,
      // ⚠️ Explicitly exclude the password hash from the response
      select: {
        id:           true,
        username:     true,
        name:         true,
        email:        true,
        avatarUrl:    true,
        venmoUsername: true,
      },
    })
    return NextResponse.json({ ok: true, user: updatedUser })
  } catch (err) {
    logError('PATCH /api/user/profile', err)
    return NextResponse.json({ error: 'Profile update failed' }, { status: 500 })
  }
}


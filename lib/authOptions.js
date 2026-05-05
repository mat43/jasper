// Centralised NextAuth configuration.
// Imported by both the [...nextauth] handler and lib/auth.js.
// Keeping it here prevents circular-import issues that arise when other
// route files import directly from the next-auth route file.

import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// ── Fail fast if the signing secret is absent ────────────────────────────────
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    '[Jasper] NEXTAUTH_SECRET is not set. ' +
    'Add it to .env and restart the server.'
  )
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize({ username, password } = {}) {
        // Reject obviously empty credentials early (avoids unnecessary DB hit)
        if (!username || !password) return null

        const user = await prisma.user.findUnique({
          where: { username },
          // Only fetch what we need; never fetch more than required
          select: {
            id: true,
            username: true,
            password: true,
            name: true,
            avatarUrl: true,
            email: true,
            venmoUsername: true,
            isAdmin: true,
            isActive: true,
          },
        })
        if (!user) return null
        if (!user.isActive) return null  // deactivated accounts cannot log in

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null

        // Strip the hash before it goes anywhere near the JWT
        const { password: _pw, isActive: _ia, ...safeUser } = user
        return safeUser
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // First sign-in: copy safe fields into the token
        token.id            = user.id
        token.username      = user.username
        token.name          = user.name
        token.avatarUrl     = user.avatarUrl
        token.email         = user.email
        token.venmoUsername = user.venmoUsername
        token.isAdmin       = user.isAdmin
      } else if (token.username) {
        // Subsequent requests: refresh from DB (exclude password explicitly)
        const dbUser = await prisma.user.findUnique({
          where: { username: token.username },
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
            email: true,
            venmoUsername: true,
            isAdmin: true,
            isActive: true,
          },
        })
        if (!dbUser || !dbUser.isActive) {
          // Account deleted or deactivated — invalidate the token so all
          // subsequent requireAuth() calls return 401 immediately.
          delete token.id
          delete token.username
        } else {
          token.id            = dbUser.id
          token.name          = dbUser.name
          token.avatarUrl     = dbUser.avatarUrl
          token.email         = dbUser.email
          token.venmoUsername = dbUser.venmoUsername
          token.isAdmin       = dbUser.isAdmin
        }
      }
      return token
    },

    async session({ session, token }) {
      // Only expose fields the client actually needs
      session.user = {
        id:            token.id,
        username:      token.username,
        name:          token.name,
        avatarUrl:     token.avatarUrl,
        email:         token.email,
        venmoUsername: token.venmoUsername,
        isAdmin:       token.isAdmin ?? false,
      }
      return session
    },
  },

  pages:  { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
  debug:  process.env.NODE_ENV === 'development',
}

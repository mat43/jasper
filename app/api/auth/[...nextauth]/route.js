// NextAuth route handler.
// All configuration lives in lib/authOptions.js to avoid circular imports
// when other API routes need authOptions for getServerSession().

import NextAuth from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'

// Re-export authOptions so existing imports from this path continue to work
export { authOptions }

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

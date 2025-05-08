// This file is responsible for handling authentication using NextAuth.js.
// It uses Prisma as the adapter to connect to the database and bcrypt for password hashing.

// Imports
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs'

export const authOptions = {
	// Hook in database
	adapter: PrismaAdapter(prisma),
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				username: { label: "Username", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize({ username, password }) {
				const user = await prisma.user.findUnique({ where: { username } });
				if (!user) return null;
				// Password checking
				const valid = await bcrypt.compare(password, user.password);
				if (!valid) return null;
				// Return user without password
				const { password: _, ...safeUser } = user;
				return safeUser;
			},
		}),
	],
	// Keep session using JSON web tokens
	session: { strategy: "jwt" },
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				// Save all database fields in token
				token.id = user.id;
				token.username = user.username;
				token.name = user.name;
				token.avatarUrl = user.avatarUrl;
				token.email = user.email;
				token.venmoUsername = user.venmoUsername;
			} else if (token.username) {
				// on subsequent requests, refresh from DB
				const dbUser = await prisma.user.findUnique({
					where: { username: token.username }
				});
				if (dbUser) {
					token.name = dbUser.name;
					token.avatarUrl = dbUser.avatarUrl;
					token.email = dbUser.email;
					token.venmoUsername = dbUser.venmoUsername;
				}
			}
			return token;
		},
		async session({ session, token }) {
			session.user = {
				id: token.id,
				username: token.username,
				name: token.name,
				avatarUrl: token.avatarUrl,
				email: token.email,
				venmoUsername: token.venmoUsername,
			};
			return session;
		},
	},
	pages: { signIn: "/login" },
	secret: process.env.NEXTAUTH_SECRET,
	debug: process.env.NODE_ENV === "development",
};

// Create a single handler and export it for GET and POST
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

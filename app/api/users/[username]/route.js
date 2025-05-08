import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
	const { username } = params
	const user = await prisma.user.findUnique({
		where: { username },
		select: { venmoUsername: true }
	})
	if (!user) {
		return NextResponse.json({ error: 'User not found' }, { status: 404 })
	}
	return NextResponse.json(user)
}

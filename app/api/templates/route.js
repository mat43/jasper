import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET() {
	try {
		const raw = await prisma.expenseTemplate.findMany({
			orderBy: { createdAt: 'desc' }
		})
		const templates = raw.map(t => ({
			...t,
			assignees: JSON.parse(t.assignees || '[]')
		}))
		return NextResponse.json(templates)
	} catch (e) {
		console.error(e)
		return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
	}
}

export async function POST(request) {
	try {
		const session = await getServerSession(authOptions)
		const createdBy = session?.user?.username || 'Unknown'
		const { description, amount, category, assignees, frequency, dayOfMonth, dayOfWeek } =
			await request.json()

		const tpl = await prisma.expenseTemplate.create({
			data: {
				description,
				amount: parseFloat(
					typeof amount === 'string'
						? amount.replace(/[^0-9.-]+/g, '')
						: amount
				),
				category,
				assignees: JSON.stringify(assignees || []),
				frequency,
				dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth, 10) : null,
				dayOfWeek: frequency === 'weekly' ? dayOfWeek : null,
				createdBy
			}
		})

		return NextResponse.json({ ...tpl, assignees: assignees || [] }, { status: 201 })
	} catch (e) {
		console.error(e)
		return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
	}
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET(request) {
	try {
		// 1) fetch raw expenses
		const expenses = await prisma.expense.findMany({
			orderBy: { createdAt: 'desc' }
		})

		// 2) normalize assignees field to always be an array
		const normalized = expenses.map(e => {
			let list = []
			if (Array.isArray(e.assignees)) {
				list = e.assignees
			} else {
				try {
					list = JSON.parse(e.assignees || '[]')
					if (!Array.isArray(list)) list = []
				} catch {
					list = []
				}
			}
			return {
				...e,
				assignees: list
			}
		})

		// 3) return normalized payload
		return NextResponse.json(normalized, { status: 200 })
	} catch (error) {
		console.error('Error fetching expenses:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch expenses' },
			{ status: 500 }
		)
	}
}

export async function POST(request) {
	try {
		// 1) get current user from session
		const session = await getServerSession(authOptions)
		const createdBy = session?.user?.username || 'Unknown'

		// 2) parse body
		const {
			description,
			amount,
			category,
			assignees,
			templateId
		} = await request.json()

		// 3) create new expense record
		const expense = await prisma.expense.create({
			data: {
				description,
				amount: parseFloat(
					typeof amount === 'string'
						? amount.replace(/[^0-9.-]+/g, '')
						: amount
				),
				category,
				assignees: JSON.stringify(assignees || []),
				createdBy,
				templateId: templateId || null
			}
		})

		return NextResponse.json(expense, { status: 201 })
	} catch (error) {
		console.error('Error adding expense:', error)
		return NextResponse.json(
			{ error: 'Failed to add expense' },
			{ status: 500 }
		)
	}
}

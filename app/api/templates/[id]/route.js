import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// DELETE /api/templates/[id]
export async function DELETE(request, context) {
	const { id } = await context.params
	const numId = Number(id)

	try {
		await prisma.expenseTemplate.delete({ where: { id: numId } })
		return new NextResponse(null, { status: 204 })
	} catch (err) {
		console.error('Error deleting template:', err)
		return NextResponse.json(
			{ error: 'Failed to delete recurring rule' },
			{ status: 500 }
		)
	}
}

// PATCH /api/templates/[id]
export async function PATCH(request, context) {
	const { id } = await context.params
	const numId = Number(id)
	const body = await request.json()

	const updates = {}
	if (body.frequency !== undefined) updates.frequency = body.frequency
	if (body.dayOfMonth !== undefined) updates.dayOfMonth = parseInt(body.dayOfMonth, 10)
	if (body.dayOfWeek !== undefined) updates.dayOfWeek = body.dayOfWeek

	try {
		const updated = await prisma.expenseTemplate.update({
			where: { id: numId },
			data: updates
		})

		let list = []
		try {
			const parsed = JSON.parse(updated.assignees || '[]')
			list = Array.isArray(parsed) ? parsed : []
		} catch {
			list = []
		}

		return NextResponse.json(
			{ ...updated, assignees: list },
			{ status: 200 }
		)
	} catch (err) {
		console.error('Error updating template:', err)
		return NextResponse.json(
			{ error: 'Failed to update recurring rule' },
			{ status: 500 }
		)
	}
}

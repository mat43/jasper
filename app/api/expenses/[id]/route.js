import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// DELETE /api/expenses/[id]
export async function DELETE(request, context) {
	const { id } = await context.params
	const numericId = Number(id)

	try {
		await prisma.expense.delete({ where: { id: numericId } })
		return new NextResponse(null, { status: 204 })
	} catch (err) {
		console.error('Failed to delete expense', err)
		return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
	}
}
export async function PATCH(request, { params }) {
	const { id } = params
	const numericId = Number(id)
	const { paid } = await request.json()

	try {
		const updated = await prisma.expense.update({
			where: { id: numericId },
			data: { paid: Boolean(paid) }
		})
		return NextResponse.json(updated, { status: 200 })
	} catch (err) {
		console.error('Failed to update expense', err)
		return NextResponse.json(
			{ error: 'Failed to update expense' },
			{ status: 500 }
		)
	}
}


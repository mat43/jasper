// scripts/generateOccurrences.js
import prisma from '../lib/prisma.js'

async function generateOccurrences() {
	const today = new Date()
	const day = today.getDate()
	const weekday = today
		.toLocaleString('en-us', { weekday: 'long' })
		.toLowerCase()

	// 1) Fetch all templates due today
	const dueTemplates = await prisma.expenseTemplate.findMany({
		where: {
			OR: [
				{ frequency: 'monthly', dayOfMonth: day },
				{ frequency: 'weekly', dayOfWeek: weekday }
			]
		}
	})

	for (const tpl of dueTemplates) {
		// 2) Only create one occurrence per template per day
		const startOfDay = new Date(today.getFullYear(), today.getMonth(), day)
		const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), day + 1)

		const exists = await prisma.expense.findFirst({
			where: {
				templateId: tpl.id,
				createdAt: {
					gte: startOfDay,
					lt: startOfTomorrow
				}
			}
		})
		if (exists) continue

		// 3) Parse the JSON‐string assignees back into an array
		let assigneesList = []
		try {
			const parsed = JSON.parse(tpl.assignees || '[]')
			if (Array.isArray(parsed)) assigneesList = parsed
		} catch {
			assigneesList = []
		}

		// 4) Create the actual expense occurrence
		await prisma.expense.create({
			data: {
				description: tpl.description,
				amount: tpl.amount,
				category: tpl.category,
				assignees: JSON.stringify(assigneesList),
				createdBy: tpl.createdBy,
				templateId: tpl.id
			}
		})
	}
}

generateOccurrences()
	.catch(err => {
		console.error('Error generating occurrences:', err)
		process.exit(1)
	})
	.finally(() => prisma.$disconnect())
